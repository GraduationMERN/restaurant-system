/**
 * Smart Search Service - Vector Search (Token-Free)
 * ==================================================
 * Uses MongoDB Atlas Vector Search with local embeddings.
 * NO LLM calls = NO token consumption!
 * 
 * Features:
 * - Semantic search using embeddings
 * - "Did you mean?" suggestions based on similarity scores
 * - Bilingual support (English + Arabic)
 * - Fallback to text search
 */

import mongoose from "mongoose";
import axios from "axios";
import Product from "../product/Product.js";
import { embeddingsModel } from "../../config/ai.js";
import { env } from "../../config/env.js";

// ==========================================
// Configuration
// ==========================================
export const searchConfig = {
  vectorSearchLimit: 20,
  numCandidates: 100,
  minScoreThreshold: 0.3,
  suggestionScoreRange: { min: 0.4, max: 0.75 }, // "Did you mean" range
  maxSuggestions: 3,
  levenshteinThreshold: 3, // Max edit distance for typo detection
};

// ==========================================
// Levenshtein Distance (Typo Detection)
// ==========================================

/**
 * Calculate Levenshtein distance between two strings
 * Used for detecting typos like "cofe" → "coffee"
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Create distance matrix
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Check if query is a typo of productName
 */
function isTypo(query, productName) {
  const q = query.toLowerCase();
  const p = productName.toLowerCase();
  
  // If query is substring, not a typo
  if (p.includes(q) || q.includes(p)) return false;
  
  // Calculate edit distance
  const distance = levenshteinDistance(q, p.split(" ")[0]); // Compare with first word
  const maxDistance = Math.min(searchConfig.levenshteinThreshold, Math.floor(q.length / 2));
  
  return distance <= maxDistance && distance > 0;
}

// ==========================================
// Section 1: Main Search Function
// ==========================================

/**
 * Semantic product search using vector embeddings
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - { results, suggestions, originalQuery }
 */
export async function semanticProductSearch(query, options = {}) {
  const {
    limit = 10,
    lang = "en",
  } = options;

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return { results: [], suggestions: [], originalQuery: query };
  }

  const cleanQuery = query.trim().toLowerCase();
  console.log(`[Search] Query: "${cleanQuery}"`);

  try {
    // Step 1: Generate embedding for query (LOCAL - no tokens!)
    const queryEmbedding = await embeddingsModel.embedQuery(cleanQuery);

    // Step 2: Vector search in MongoDB
    const vectorResults = await performVectorSearch(queryEmbedding, {
      limit: limit * 2, // Get extra for suggestions
    });

    // Step 3: Generate "Did you mean?" suggestions
    const suggestions = generateSuggestions(vectorResults, cleanQuery, lang);

    // Step 4: Format and return results
    const results = vectorResults
      .filter(r => r.score >= searchConfig.minScoreThreshold)
      .slice(0, limit)
      .map(p => formatProductResult(p, lang));

    console.log(`[Search] Found ${results.length} results, ${suggestions.length} suggestions`);

    return {
      results,
      suggestions,
      originalQuery: query,
      totalResults: results.length,
    };

  } catch (error) {
    console.error("[Search] Vector search failed, using fallback:", error.message);
    
    // Fallback to text search
    return await fallbackSearch(cleanQuery, { limit, lang });
  }
}

// ==========================================
// Section 2: Vector Search (MongoDB)
// ==========================================

/**
 * Perform vector search using MongoDB Atlas $vectorSearch
 */
async function performVectorSearch(queryVector, options = {}) {
  const {
    limit = searchConfig.vectorSearchLimit,
    numCandidates = searchConfig.numCandidates,
  } = options;

  const pipeline = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryVector,
        numCandidates: numCandidates,
        limit: limit,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        name_ar: 1,
        desc: 1,
        desc_ar: 1,
        basePrice: 1,
        imgURL: 1,
        stock: 1,
        tags: 1,
        options: 1,
        categoryId: 1,
        categoryName: "$category.name",
        categoryName_ar: "$category.name_ar",
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  const results = await Product.aggregate(pipeline);
  console.log(`[Search] Vector search returned ${results.length} results`);
  
  return results;
}

// ==========================================
// Section 3: Suggestions ("Did you mean?")
// ==========================================

/**
 * Generate "Did you mean?" suggestions based on:
 * 1. Vector similarity scores (semantic match)
 * 2. Levenshtein distance (typo detection)
 */
function generateSuggestions(results, originalQuery, lang = "en") {
  if (!results.length) return [];
  
  const suggestions = [];
  const seen = new Set();

  // Strategy 1: Find typos using Levenshtein distance
  for (const product of results) {
    const name = lang === "ar" 
      ? (product.name_ar || product.name) 
      : product.name;
    
    const normalizedName = name.toLowerCase();
    
    // Skip if already suggested or exact match
    if (seen.has(normalizedName) || normalizedName.includes(originalQuery)) {
      continue;
    }

    // Check if query is a typo of this product name
    if (isTypo(originalQuery, name)) {
      seen.add(normalizedName);
      suggestions.push({
        text: name,
        score: Math.round(product.score * 100) / 100,
        productId: product._id.toString(),
        reason: "typo", // Mark as typo-based suggestion
      });
    }

    if (suggestions.length >= searchConfig.maxSuggestions) break;
  }

  // Strategy 2: If no typos found, use score-based suggestions
  if (suggestions.length === 0) {
    const { min, max } = searchConfig.suggestionScoreRange;
    
    for (const product of results) {
      // Medium score = might be what user meant
      if (product.score >= min && product.score < max) {
        const name = lang === "ar" 
          ? (product.name_ar || product.name) 
          : product.name;
        
        const normalizedName = name.toLowerCase();
        
        if (seen.has(normalizedName) || normalizedName.includes(originalQuery)) {
          continue;
        }

        seen.add(normalizedName);
        suggestions.push({
          text: name,
          score: Math.round(product.score * 100) / 100,
          productId: product._id.toString(),
          reason: "similar",
        });
      }

      if (suggestions.length >= searchConfig.maxSuggestions) break;
    }
  }

  return suggestions;
}

// ==========================================
// Section 4: Fallback Text Search
// ==========================================

/**
 * Fallback search using regex (when vector search fails)
 */
async function fallbackSearch(query, options = {}) {
  const { limit = 10, lang = "en" } = options;
  
  console.log("[Search] Using fallback text search");

  try {
    const regex = new RegExp(query.split("").join(".*"), "i");
    
    const results = await Product.find({
      $or: [
        { name: regex },
        { name_ar: regex },
        { desc: regex },
        { tags: { $in: [new RegExp(query, "i")] } },
      ],
    })
      .populate("categoryId", "name name_ar")
      .limit(limit)
      .lean();

    return {
      results: results.map(p => formatProductResult(p, lang)),
      suggestions: [],
      originalQuery: query,
      totalResults: results.length,
      fallback: true,
    };
  } catch (error) {
    console.error("[Search] Fallback search failed:", error.message);
    return { results: [], suggestions: [], originalQuery: query };
  }
}

// ==========================================
// Section 5: Helpers
// ==========================================

/**
 * Format product for response
 */
function formatProductResult(product, lang = "en") {
  return {
    _id: product._id,
    name: lang === "ar" ? (product.name_ar || product.name) : product.name,
    name_ar: product.name_ar,
    name_en: product.name,
    desc: lang === "ar" ? (product.desc_ar || product.desc) : product.desc,
    basePrice: product.basePrice,
    imgURL: product.imgURL,
    stock: product.stock,
    categoryId: product.categoryId,
    categoryName: lang === "ar" 
      ? (product.categoryName_ar || product.categoryName) 
      : product.categoryName,
    options: product.options,
    tags: product.tags,
    score: product.score ? Math.round(product.score * 100) / 100 : null,
  };
}

/**
 * Quick search for autocomplete (lighter)
 */
export async function quickSearch(query, limit = 5) {
  if (!query || query.length < 2) return [];

  try {
    const queryEmbedding = await embeddingsModel.embedQuery(query.toLowerCase());
    
    const results = await Product.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: limit,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          name_ar: 1,
          imgURL: 1,
          basePrice: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    return results;
  } catch (error) {
    console.error("[Search] Quick search failed:", error.message);
    return [];
  }
}

// ==========================================
// Section 6: Image Search (Gemini Vision)
// ==========================================

/**
 * Analyze image with Gemini Vision API to get food description
 * @param {string} imageUrl - URL of the image (Cloudinary URL)
 * @returns {Promise<string>} - Text description of the food in the image
 */
async function analyzeImageWithGemini(imageUrl) {
  const apiKey = env.geminiApiKey;
  const model = env.geminiModel;
  
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY for image search");
  }

  // Fetch image and convert to base64
  const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const base64 = Buffer.from(imageResponse.data, "binary").toString("base64");
  const mime = imageResponse.headers["content-type"] || "image/jpeg";

  const prompt = `You are a food recognition assistant. Analyze this image and describe the food you see.
  
Return ONLY a simple description focusing on:
- The name of the dish/food (e.g., "burger", "pizza", "coffee", "salad")
- Key ingredients visible (e.g., "cheese", "tomato", "lettuce")
- Type of cuisine if obvious (e.g., "Italian", "Mexican", "American")

Keep the description short (under 50 words). Focus on identifying what food this is.
If no food is visible, respond with "unknown food item".

Example response: "A cheeseburger with lettuce, tomato, and pickles. Classic American fast food."`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { data: base64, mimeType: mime } },
        ],
      },
    ],
    generationConfig: { temperature: 0.3 },
  };

  const response = await axios.post(url, body);
  const candidates = response.data?.candidates || [];
  const description = candidates[0]?.content?.parts?.[0]?.text || "food item";
  
  console.log(`[ImageSearch] Gemini description: "${description}"`);
  return description.trim();
}

/**
 * Image-based product search
 * Uses Gemini Vision to understand image content, then semantic search
 * @param {string} imageUrl - URL of the uploaded image
 * @param {Object} options - Search options (limit, lang)
 * @returns {Promise<Object>} - { results, originalImageUrl }
 */
export async function imageSearch(imageUrl, options = {}) {
  const { limit = 10, lang = "en" } = options;

  if (!imageUrl) {
    return { results: [], originalImageUrl: null };
  }

  console.log(`[ImageSearch] Processing image: ${imageUrl}`);

  try {
    // Step 1: Get text description from image using Gemini Vision
    const description = await analyzeImageWithGemini(imageUrl);

    // Step 2: Generate embedding for the description
    const queryEmbedding = await embeddingsModel.embedQuery(description.toLowerCase());

    // Step 3: Vector search using the embedding
    const vectorResults = await performVectorSearch(queryEmbedding, {
      limit: limit * 2,
    });

    // Step 4: Format results (use slightly lower threshold for image search)
    const results = vectorResults
      .filter(r => r.score >= 0.25)
      .slice(0, limit)
      .map(p => formatProductResult(p, lang));

    console.log(`[ImageSearch] Found ${results.length} results for image`);

    return {
      success: true,
      results,
      description,
      originalImageUrl: imageUrl,
      totalResults: results.length,
    };

  } catch (error) {
    console.error("[ImageSearch] Error:", error.message);
    throw error;
  }
}

export default {
  semanticProductSearch,
  quickSearch,
  imageSearch,
  searchConfig,
};

