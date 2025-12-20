/**
 * RAG Service for Recommendation System
 * =====================================
 * This module provides Retrieval-Augmented Generation (RAG) utilities
 * for intelligent product recommendations using MongoDB Atlas Vector Search.
 *
 * Key Features:
 * - Semantic search using MongoDB $vectorSearch
 * - Context document builder for LLM augmentation
 * - Fallback to math-based retrieval if vector search fails
 */

import mongoose from "mongoose";
import Product from "../product/Product.js";
import { embeddingsModel } from "../../config/ai.js";

// ==========================================
// RAG Configuration
// ==========================================
export const ragConfig = {
  // Vector search parameters
  vectorSearchNumCandidates: 100, // Broader initial search
  vectorSearchLimit: 20, // Top results to return
  minScoreThreshold: 0.5, // Minimum relevance score

  // Context building
  maxContextProducts: 15,
  maxContextTokens: 2000,

  // Fallback settings
  enableFallback: true,
  fallbackLimit: 10,
};

// ==========================================
// Section 1: Embedding Utilities
// ==========================================

/**
 * Generate embedding for a text query using the configured model
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateQueryEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text for embedding generation");
  }

  try {
    const embedding = await embeddingsModel.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error("[RAG] Embedding generation failed:", error.message);
    throw error;
  }
}

/**
 * Build a rich text representation of cart items for embedding
 * @param {Array} cartProducts - Products in cart with populated data
 * @returns {string} - Combined text for embedding
 */
export function buildCartQueryText(cartProducts) {
  if (!cartProducts || !cartProducts.length) return "";

  const parts = cartProducts.map((p) => {
    const product = p.productId || p;
    const category = product.categoryName || "";
    const tags = Array.isArray(product.tags) ? product.tags.join(" ") : "";
    return `${product.name} ${category} ${tags}`.trim();
  });

  return parts.join(". ");
}

// ==========================================
// Section 2: Vector Search (Retrieval)
// ==========================================

/**
 * Perform semantic vector search using MongoDB Atlas Search
 * @param {number[]} queryVector - Query embedding vector
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Matching products with scores
 */
export async function semanticSearch(queryVector, options = {}) {
  const {
    limit = ragConfig.vectorSearchLimit,
    numCandidates = ragConfig.vectorSearchNumCandidates,
    excludeIds = [],
    filter = {},
  } = options;

  try {
    // Convert string IDs to ObjectIds
    const excludeObjectIds = excludeIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    // Build aggregation pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: numCandidates,
          limit: limit * 2, // Get extra to account for filtering
        },
      },
      {
        $match: {
          stock: { $gt: 0 },
          ...(excludeObjectIds.length && { _id: { $nin: excludeObjectIds } }),
          ...filter,
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
          basePrice: 1,
          imgURL: 1,
          stock: 1,
          tags: 1,
          categoryId: 1,
          categoryName: "$category.name",
          options: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
      { $limit: limit },
    ];

    const results = await Product.aggregate(pipeline);

    console.log(`[RAG] Vector search returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error("[RAG] Vector search failed:", error.message);

    // Check if it's an index error
    if (error.message.includes("vector_index")) {
      console.warn("[RAG] Vector index may not exist. Using fallback.");
    }

    return []; // Return empty to trigger fallback
  }
}

/**
 * Fallback text-based search when vector search fails
 * @param {string} queryText - Search query text
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Matching products
 */
export async function fallbackTextSearch(queryText, options = {}) {
  const { limit = ragConfig.fallbackLimit, excludeIds = [] } = options;

  try {
    const words = queryText.split(/\s+/).filter((w) => w.length > 2);
    if (!words.length) return [];

    const regexPattern = words.map((w) => `(?=.*${w})`).join("");

    const results = await Product.find({
      $and: [
        { stock: { $gt: 0 } },
        { _id: { $nin: excludeIds } },
        {
          $or: [
            { name: new RegExp(regexPattern, "i") },
            { desc: new RegExp(regexPattern, "i") },
            { tags: { $in: words } },
          ],
        },
      ],
    })
      .populate("categoryId", "name name_ar")
      .limit(limit)
      .lean();

    // Add category name to results
    return results.map((p) => ({
      ...p,
      categoryName: p.categoryId?.name || "",
      score: 0.5, // Default score for text matches
    }));
  } catch (error) {
    console.error("[RAG] Fallback search failed:", error.message);
    return [];
  }
}

// ==========================================
// Section 3: Context Building (Augmentation)
// ==========================================

/**
 * Build a context document for LLM from retrieved products
 * @param {Array} cartItems - Items currently in cart
 * @param {Array} candidates - Retrieved candidate products
 * @returns {Object} - Structured context for LLM
 */
export function buildContextDocument(cartItems, candidates) {
  // Cart summary
  const cartSummary = cartItems
    .map((item) => {
      const p = item.productId || item;
      const type = categorizeProduct(p);
      return {
        name: p.name,
        category: p.categoryName || "",
        type: type,
        price: p.basePrice,
      };
    })
    .slice(0, 5); // Max 5 items for context

  // Candidates summary (grouped by type)
  const candidatesByType = {};
  candidates.forEach((c) => {
    const type = categorizeProduct(c);
    if (!candidatesByType[type]) candidatesByType[type] = [];
    candidatesByType[type].push({
      id: c._id.toString(),
      name: c.name,
      category: c.categoryName || "",
      price: c.basePrice,
      score: c.score?.toFixed(2) || "N/A",
      tags: c.tags || [],
    });
  });

  // Build context object
  return {
    cart: {
      items: cartSummary,
      hasMain: cartSummary.some((i) => i.type === "main"),
      hasDrink: cartSummary.some((i) => i.type === "drink"),
      hasDessert: cartSummary.some((i) => i.type === "dessert"),
      totalItems: cartItems.length,
    },
    candidates: candidatesByType,
    candidateCount: candidates.length,
    retrievalMethod: "vector_search",
  };
}

/**
 * Format context document as text for LLM prompt
 * @param {Object} context - Context document from buildContextDocument
 * @returns {string} - Formatted text for LLM
 */
export function formatContextForLLM(context) {
  let text = "## Customer Cart Analysis\n";

  // Cart items
  text += `Cart contains ${context.cart.totalItems} item(s):\n`;
  context.cart.items.forEach((item) => {
    text += `- ${item.name} (${item.category}) - ${item.price} EGP [${item.type}]\n`;
  });

  // Cart characteristics
  text += "\nCart Status:\n";
  text += `- Has main dish: ${context.cart.hasMain ? "Yes" : "No"}\n`;
  text += `- Has drink: ${context.cart.hasDrink ? "Yes" : "No"}\n`;
  text += `- Has dessert: ${context.cart.hasDessert ? "Yes" : "No"}\n`;

  // Candidates by type
  text += `\n## Retrieved Candidates (${context.candidateCount} items)\n`;
  for (const [type, items] of Object.entries(context.candidates)) {
    text += `\n### ${type.toUpperCase()} (${items.length} items)\n`;
    items.slice(0, 5).forEach((item) => {
      text += `- ID: ${item.id} | ${item.name} | ${item.price} EGP | Score: ${item.score}\n`;
    });
  }

  return text;
}

// ==========================================
// Section 4: Helper Functions
// ==========================================

/**
 * Categorize a product into type buckets
 * @param {Object} product - Product object
 * @returns {string} - Product type: main, drink, side, dessert, other
 */
export function categorizeProduct(product) {
  const text = `${product.name || ""} ${product.categoryName || ""} ${
    (product.tags || []).join(" ")
  }`.toLowerCase();

  if (/(juice|drink|beverage|soda|cola|tea|coffee|عصير|مشروب)/.test(text)) {
    return "drink";
  }
  if (/(dessert|sweet|cake|ice cream|pie|pudding|cookie|حلو|كيك)/.test(text)) {
    return "dessert";
  }
  if (/(fries|side|salad|soup|appetizer|starter|dip|bread|سلطة|شوربة)/.test(text)) {
    return "side";
  }
  if (/(burger|pizza|sandwich|shawarma|wrap|meal|plate|steak|pasta|chicken|beef|برجر|بيتزا|شاورما)/.test(text)) {
    return "main";
  }
  return "other";
}

/**
 * Calculate average price of cart items
 * @param {Array} cartProducts - Products in cart
 * @returns {number} - Average price
 */
export function calculateAverageCartPrice(cartProducts) {
  if (!cartProducts?.length) return 0;

  let total = 0;
  let count = 0;

  cartProducts.forEach((item) => {
    const price = item.productId?.basePrice || item.basePrice || 0;
    const qty = item.quantity || 1;
    if (price > 0) {
      total += price * qty;
      count += qty;
    }
  });

  return count > 0 ? total / count : 0;
}

/**
 * Filter candidates by price range (avoid too expensive/cheap suggestions)
 * @param {Array} candidates - Candidate products
 * @param {number} avgPrice - Average cart price
 * @returns {Array} - Filtered candidates
 */
export function filterByPriceRange(candidates, avgPrice) {
  if (!avgPrice || avgPrice <= 0) return candidates;

  const minPrice = avgPrice * 0.2;
  const maxPrice = avgPrice * 3;

  return candidates.filter((c) => {
    const price = c.basePrice || 0;
    return price >= minPrice && price <= maxPrice;
  });
}

// ==========================================
// Section 5: Integrated RAG Pipeline
// ==========================================

/**
 * Main RAG retrieval function for cart-based recommendations
 * @param {Array} cartProducts - Populated cart products
 * @param {Object} options - Options for retrieval
 * @returns {Promise<Array>} - Retrieved candidates with context
 */
export async function ragRetrieveForCart(cartProducts, options = {}) {
  const {
    limit = ragConfig.vectorSearchLimit,
    excludeIds = [],
  } = options;

  // Step 1: Build query from cart
  const queryText = buildCartQueryText(cartProducts);
  if (!queryText) {
    console.log("[RAG] Empty cart query, returning empty results");
    return { candidates: [], context: null };
  }

  console.log(`[RAG] Query text: "${queryText.substring(0, 100)}..."`);

  // Step 2: Generate embedding
  let queryVector;
  try {
    queryVector = await generateQueryEmbedding(queryText);
  } catch (error) {
    console.error("[RAG] Embedding failed, using fallback");
    const fallbackResults = await fallbackTextSearch(queryText, { limit, excludeIds });
    return {
      candidates: fallbackResults,
      context: buildContextDocument(cartProducts, fallbackResults),
    };
  }

  // Step 3: Vector search
  const cartProductIds = cartProducts
    .map((p) => (p.productId?._id || p._id)?.toString())
    .filter(Boolean);

  const allExcludeIds = [...new Set([...cartProductIds, ...excludeIds])];

  let candidates = await semanticSearch(queryVector, {
    limit,
    excludeIds: allExcludeIds,
  });

  // Step 4: Fallback if no results
  if (!candidates.length && ragConfig.enableFallback) {
    console.log("[RAG] Vector search empty, using fallback");
    candidates = await fallbackTextSearch(queryText, {
      limit,
      excludeIds: allExcludeIds,
    });
  }

  // Step 5: Build context
  const context = buildContextDocument(cartProducts, candidates);

  return { candidates, context };
}

/**
 * RAG retrieval for similar products (product detail page)
 * @param {Object} baseProduct - The product to find similar items for
 * @param {Object} options - Options for retrieval
 * @returns {Promise<Object>} - Retrieved candidates
 */
export async function ragRetrieveForProduct(baseProduct, options = {}) {
  const { limit = 10 } = options;

  // Use product embedding directly if available
  if (baseProduct.embedding && baseProduct.embedding.length > 0) {
    const candidates = await semanticSearch(baseProduct.embedding, {
      limit,
      excludeIds: [baseProduct._id.toString()],
      filter: { categoryId: baseProduct.categoryId }, // Prefer same category
    });

    // If no same-category results, search across all
    if (!candidates.length) {
      const broadCandidates = await semanticSearch(baseProduct.embedding, {
        limit,
        excludeIds: [baseProduct._id.toString()],
      });
      return { candidates: broadCandidates };
    }

    return { candidates };
  }

  // Fallback: build query from product info
  const queryText = `${baseProduct.name} ${baseProduct.categoryName || ""} ${
    (baseProduct.tags || []).join(" ")
  }`;

  try {
    const queryVector = await generateQueryEmbedding(queryText);
    const candidates = await semanticSearch(queryVector, {
      limit,
      excludeIds: [baseProduct._id.toString()],
    });
    return { candidates };
  } catch (error) {
    const fallback = await fallbackTextSearch(queryText, {
      limit,
      excludeIds: [baseProduct._id.toString()],
    });
    return { candidates: fallback };
  }
}

export default {
  ragConfig,
  generateQueryEmbedding,
  buildCartQueryText,
  semanticSearch,
  fallbackTextSearch,
  buildContextDocument,
  formatContextForLLM,
  categorizeProduct,
  calculateAverageCartPrice,
  filterByPriceRange,
  ragRetrieveForCart,
  ragRetrieveForProduct,
};
