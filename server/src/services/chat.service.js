/**
 * RAG Engine Module - Modular version for Express integration
 */

import { pipeline } from '@xenova/transformers';
import { MongoClient } from 'mongodb';
import fs from 'fs/promises';

process.loadEnvFile();

// Configuration
const CONFIG = {
    mongoUrl: process.env.MONGO_URL,
    dbName: 'restaurant_rag',
    collectionName: 'menu_items',
    embeddingModel: 'Xenova/all-MiniLM-L6-v2',
    topK: 3,
    llmApiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    llmModel: 'llama-3.3-70b-versatile',
    llmMaxTokens: 500,
};

// Global variables
let extractor = null;
let mongoClient = null;
let db = null;
let collection = null;

/**
 * Initialize the embedding model
 */
async function initializeEmbeddingModel() {
    if (!extractor) {
        console.log('[RAG] Loading embedding model...');
        extractor = await pipeline('feature-extraction', CONFIG.embeddingModel);
        console.log('[RAG] Embedding model loaded successfully');
    }
}

/**
 * Generate embedding for text
 */
async function getEmbedding(text) {
    await initializeEmbeddingModel();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
}

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
    if (!mongoClient) {
        console.log('[RAG] Connecting to MongoDB...');
        mongoClient = new MongoClient(CONFIG.mongoUrl);
        await mongoClient.connect();
        db = mongoClient.db(CONFIG.dbName);
        collection = db.collection(CONFIG.collectionName);
        await collection.createIndex({ name: 1 });
        console.log('[RAG] Connected to MongoDB');
    }
}

/**
 * Save menu embeddings to database
 */
async function saveMenuEmbeddings() {
    await connectToDatabase();

    console.log('[RAG] Loading menu items from menu.json...');
    const menuData = await fs.readFile('./menu.json', 'utf-8');
    const menuItems = JSON.parse(menuData);

    console.log(`[RAG] Processing ${menuItems.length} menu items...`);

    await collection.deleteMany({});

    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        const textToEmbed = `${item.name}. ${item.description}`;

        console.log(`[RAG] Embedding: ${item.name} (${i + 1}/${menuItems.length})`);
        const embedding = await getEmbedding(textToEmbed);

        const document = {
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            dietary: item.dietary || [],
            spicy: item.spicy || false,
            embedding: embedding,
            createdAt: new Date()
        };

        await collection.insertOne(document);
    }

    console.log('[RAG] All embeddings saved successfully!');
}

/**
 * Get top matching menu items
 */
async function getTopMatches(questionEmbedding, topK = CONFIG.topK) {

    const allItems = await collection.find({}).toArray();

    const itemsWithScores = allItems.map(item => {
        const similarity = cosineSimilarity(questionEmbedding, item.embedding);
        return {
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            dietary: item.dietary || [],
            spicy: item.spicy || false,
            similarityScore: similarity
        };
    });

    itemsWithScores.sort((a, b) => b.similarityScore - a.similarityScore);
    return itemsWithScores.slice(0, topK);
}

/**
 * Call Groq LLM API
 */
async function callLLM(context, question) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable not set');
    }

    const systemPrompt = `You are a friendly restaurant assistant. Answer questions about menu items based ONLY on the provided context. Be concise, friendly, and helpful. If you don't have enough information, politely say so.`;

    const userMessage = `Context (menu items):
${context}

Customer Question: ${question}

Please provide a helpful, friendly answer based on the context above.`;

    const requestBody = {
        model: CONFIG.llmModel,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        max_tokens: CONFIG.llmMaxTokens,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
    };

    try {
        const response = await fetch(CONFIG.llmApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response generated');
        }

        return data.choices[0].message.content;

    } catch (error) {
        console.error('[RAG] LLM error:', error);
        throw error;
    }
}

/**
 * Main RAG function - Answer user question
 */
async function answerQuestion(question) {
    console.log(`[RAG] Processing: "${question}"`);

    try {
        // Generate question embedding
        const questionEmbedding = await getEmbedding(question);

        // Find top matches
        const topMatches = await getTopMatches(questionEmbedding);

        console.log(`[RAG] Found ${topMatches.length} relevant items`);

        // Build context
        const context = topMatches.map(match =>
            `- ${match.name} ($${match.price}): ${match.description} [Category: ${match.category}, Dietary: ${match.dietary.join(', ') || 'None'}, Spicy: ${match.spicy ? 'Yes' : 'No'}]`
        ).join('\n');

        // Generate answer
        const answer = await callLLM(context, question);

        return {
            success: true,
            answer: answer,
            relevantItems: topMatches.map(item => ({
                name: item.name,
                price: item.price,
                similarity: item.similarityScore.toFixed(3)
            }))
        };

    } catch (error) {
        console.error('[RAG] Error:', error);
        return {
            success: false,
            error: error.message,
            answer: "I'm having trouble processing your question right now. Please try again."
        };
    }
}

// Export functions
export {
    initializeEmbeddingModel,
    connectToDatabase,
    answerQuestion,
    saveMenuEmbeddings,
    getEmbedding,
    getTopMatches
};
