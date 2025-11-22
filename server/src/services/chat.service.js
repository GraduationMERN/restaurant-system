/**
 * ragEngine - generates embeddings, retrieves top matches from Products & Reviews,
 * builds context and calls LLM.
 */

import { pipeline } from '@xenova/transformers';
import { updateEmbeddingProductByID, getAllProductsWithLean } from '../repositories/product.repository.js';
import { env } from "../config/env.js"
import dotenv from "dotenv";
dotenv.config();

const CONFIG = { llmMaxTokens: 500 };

let extractor = null;

export async function initializeEmbeddingModel() {
    if (!extractor) {
        console.log('[RAG] Loading embedding model...');
        extractor = await pipeline('feature-extraction', env.embeddingModel);
        console.log('[RAG] Embedding model loaded');
    }
}

export async function getEmbedding(text) {
    await initializeEmbeddingModel();
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    // out.data might be Float32Array or similar
    return Array.from(out.data);
}

export function cosineSimilarity(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return 0;
    if (a.length !== b.length) {
        // if lengths differ, you may want to pad or return 0
        return 0;
    }
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
}

/* ---------- Save embeddings (one-time scripts use these) ---------- */

export async function saveAllProductEmbeddings() {
    console.log('[RAG] Generating product embeddings...');
    const products = await getAllProductsWithLean();
    for (const p of products) {
        const text = `${p.name}. ${p.desc}. Tags: ${p.tags?.join(',') || ''}. Price: ${p.price}`;
        const embedding = await getEmbedding(text);
        await updateEmbeddingProductByID(p._id, { embedding });
        console.log(`[RAG] Saved embedding for product: ${p.name}`);
    }
    console.log('[RAG] Product embeddings complete');
}

/* ---------- Retrieval ---------- */

export async function getTopProductMatches(questionEmbedding, topK = env.topK) {
    const products = await getAllProductsWithLean();
    const scored = products.map(p => ({
        _id: p._id,
        name: p.name,
        desc: p.desc,
        price: p.basePrice,
        tags: p.tags || [],
        categoryId: p.categoryId,
        similarity: cosineSimilarity(questionEmbedding, p.embedding || [])
    }));
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
}


/* ---------- Build context & call LLM ---------- */

function buildContext(products = []) {
    const prodCtx = products.map(p =>
        `Product: ${p.name}. ${p.desc}. Price: ${p.price}. Tags: ${p.tags?.join(', ') || 'None'}.`
    ).join('\n');

    return `${prodCtx}`.trim();
}

export async function callLLM(context, question) {
    const apiKey = env.groqApiKey;
    const url = env.llmApiUrl;
    if (!apiKey || !url) throw new Error('GROQ_API_KEY or GROQ_API_URL not set');

    const systemPrompt = `You are a friendly restaurant assistant. Answer questions about menu items, prices, and customer opinions based ONLY on the provided context. If there's not enough info, say so. Be concise and reply as customer service `;

    const userMessage = `Context:
${context}

Customer Question: ${question}`;

    const requestBody = {
        model: env.llmModel,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        max_tokens: CONFIG.llmMaxTokens,
        temperature: 0.2,
        top_p: 0.9,
        stream: false
    };

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`LLM API error: ${resp.status} ${err}`);
    }
    const data = await resp.json();
    if (!data.choices || data.choices.length === 0) throw new Error('No reply from LLM');
    return data.choices[0].message.content;
}

/* ---------- Main API for answering ---------- */

export async function answerQuestion(question) {
    await initializeEmbeddingModel();
    const qEmb = await getEmbedding(question);

    // retrieve from multiple sources
    const topProducts = await getTopProductMatches(qEmb, env.topK);

    const context = buildContext(topProducts);

    // If context is empty, short-circuit
    if (!context) {
        return {
            success: true,
            answer: "Sorry, there isn't enough information about this right now",
            relevant: { products: [] }
        };
    }

    const llmAnswer = await callLLM(context, question);

    return {
        success: true,
        answer: llmAnswer,
        relevant: {
            products: topProducts.map(p => ({ id: p._id, name: p.name, price: p.price, score: p.similarity.toFixed(3) })),
        }
    };
}
