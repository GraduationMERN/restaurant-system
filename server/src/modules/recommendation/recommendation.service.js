/**
 * Recommendation Service - RAG-Powered
 * =====================================
 * Upgraded to use Retrieval-Augmented Generation (RAG) for smarter recommendations.
 * 
 * Architecture:
 * 1. RETRIEVAL: MongoDB $vectorSearch for semantic retrieval
 * 2. AUGMENTATION: Rich context building from cart + retrieved products
 * 3. GENERATION: LLM selects and explains best recommendations
 * 
 * Fallback: Math-based scoring (co-purchase + similarity) if RAG fails
 */

import mongoose from "mongoose";
import Product from "../product/Product.js";
import Order from "../order.module/orderModel.js";
import { getCartForUserService } from "../cart/cart.service.js";
import { getProductByIdService } from "../product/product.service.js";

// --- LangChain & AI Imports ---
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// --- RAG Imports ---
import {
  ragRetrieveForCart,
  ragRetrieveForProduct,
  formatContextForLLM,
  categorizeProduct,
  calculateAverageCartPrice,
  filterByPriceRange,
  ragConfig,
} from "./rag.service.js";

// Initialize LLM Model
const llm = new ChatGroq({
  model: "llama-3.1-70b-versatile",
  temperature: 0.2,
  apiKey: process.env.GROQ_API_KEY,
});

// --- AI Configuration: Output Schema ---
const RecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      productId: z.string().describe("The exact Mongo ID of the recommended product from the candidates list"),
      reason: z.string().describe("A short, persuasive marketing reason (max 1 sentence) explaining why this item pairs well with the user's current cart."),
    })
  ).describe("A list of the top recommended products"),
});

// ==========================================
// SECTION 1: Legacy Helper Functions (Fallback)
// ==========================================

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const len = Math.min(a.length, b.length);
  if (!len) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Co-purchase data for fallback scoring
async function getCoPurchaseCountsForProduct(productId) {
  const objectId = new mongoose.Types.ObjectId(productId);
  const rows = await Order.aggregate([
    { $match: { "items.productId": objectId } },
    { $unwind: "$items" },
    { $match: { "items.productId": { $ne: objectId } } },
    { $group: { _id: "$items.productId", count: { $sum: "$items.quantity" } } },
  ]);
  const map = new Map();
  rows.forEach((row) => {
    if (row?._id) map.set(row._id.toString(), row.count || 0);
  });
  return map;
}

async function getCoPurchaseCountsForProducts(productIds) {
  if (!productIds.length) return new Map();
  const objectIds = productIds.map((id) => new mongoose.Types.ObjectId(id));
  const rows = await Order.aggregate([
    { $match: { "items.productId": { $in: objectIds } } },
    { $unwind: "$items" },
    { $match: { "items.productId": { $nin: objectIds } } },
    { $group: { _id: "$items.productId", count: { $sum: "$items.quantity" } } },
  ]);
  const map = new Map();
  rows.forEach((row) => {
    if (row?._id) map.set(row._id.toString(), row.count || 0);
  });
  return map;
}

// ==========================================
// SECTION 2: AI RAG Generation
// ==========================================

/**
 * RAG-enhanced AI reranking with rich context
 * Uses retrieved context to make smarter recommendations
 */
async function aiRerankWithRAG(cartItems, candidates, context, limitParam = 6) {
  if (!candidates.length) return [];

  // Build rich context for LLM
  const contextText = formatContextForLLM(context);

  // Prepare candidate list with IDs
  const candidatesDescription = candidates
    .slice(0, 20) // Limit to avoid token overflow
    .map((c) => {
      const type = categorizeProduct(c);
      return `ID: ${c._id} | Name: ${c.name} | Category: ${c.categoryName || "General"} | Type: ${type} | Price: ${c.basePrice} EGP | Relevance: ${(c.score || 0).toFixed(2)}`;
    })
    .join("\n");

  // Enhanced RAG Prompt - Prioritizing "Frequently Bought Together"
  const promptTemplate = PromptTemplate.fromTemplate(`
    You are an expert restaurant recommendation AI.
    
    ## CUSTOMER'S CURRENT CART:
    {context}

    ## CANDIDATE PRODUCTS (ranked by purchase correlation - items frequently bought together):
    {candidates}

    ## YOUR TASK:
    Select up to {limit} items that customers FREQUENTLY BUY TOGETHER with items in the cart.
    
    PRIORITY ORDER (most important first):
    1. **FREQUENTLY BOUGHT TOGETHER** - Items with highest "Relevance" score are bought together most often
    2. **COMPLEMENTARY ITEMS** - Items that complete the meal (e.g., drink with burger)
    3. **PRICE MATCH** - Similar price range to cart items
    
    RULES:
    - Prefer items with HIGHER relevance scores (these are statistically proven pairings)
    - Don't suggest items already in cart
    - Focus on what ACTUALLY sells together, not theoretical pairings
    
    For each recommendation:
    - Use the exact product ID from candidates list
    - Write reason like "Frequently ordered with [cart item]" or "Popular combo"
    - Keep reason short (1 sentence max)

    Return ONLY valid product IDs from the candidates list above.
  `);

  const structuredLlm = llm.withStructuredOutput(RecommendationSchema);
  const chain = promptTemplate.pipe(structuredLlm);

  try {
    const result = await chain.invoke({
      context: contextText,
      candidates: candidatesDescription,
      limit: Math.max(3, Math.min(12, Number(limitParam) || 6)),
    });

    console.log("[RAG] AI returned", result.recommendations?.length || 0, "recommendations");
    return result.recommendations || [];
  } catch (error) {
    console.error("[RAG] AI Rerank Failed:", error.message);
    return [];
  }
}

// ==========================================
// SECTION 3: Main Exported Services (RAG)
// ==========================================

/**
 * RAG-Powered Cart Recommendations
 * 
 * Pipeline:
 * 1. Fetch cart → Build query embedding
 * 2. Vector search → Get semantically similar products
 * 3. Build context → Augment with cart analysis
 * 4. LLM → Generate personalized recommendations
 * 5. Fallback → Math-based scoring if needed
 */
export async function recommendForCart(userId, limit = 3) {
  console.log(`[RAG] Starting cart recommendations for user: ${userId}`);
  
  // 1. Fetch User Cart
  const cart = await getCartForUserService(userId);
  console.log(`[RAG] Cart lookup result:`, cart ? `Found cart with ${cart.products?.length || 0} products` : 'No cart found');
  
  if (!cart || !cart.products || !cart.products.length) {
    console.log("[RAG] Empty cart, returning no recommendations");
    return [];
  }

  const cartProducts = cart.products
    .map((p) => p.productId)
    .filter((p) => !!p && !!p._id);

  if (!cartProducts.length) return [];
  const cartProductIds = cartProducts.map((p) => p._id.toString());

  // 2. Get Co-Purchase Data FIRST (Frequently Bought Together)
  console.log("[RAG] Fetching co-purchase data...");
  const coPurchaseMap = await getCoPurchaseCountsForProducts(cartProductIds);
  console.log(`[RAG] Found ${coPurchaseMap.size} co-purchase relationships`);

  // 3. RAG Retrieval (Semantic)
  console.log("[RAG] Performing semantic retrieval...");
  const { candidates, context } = await ragRetrieveForCart(cart.products, {
    limit: ragConfig.vectorSearchLimit,
    excludeIds: cartProductIds,
  });

  console.log(`[RAG] Retrieved ${candidates.length} candidates`);

  // 4. Boost candidates by co-purchase frequency
  const boostedCandidates = candidates.map(c => {
    const coCount = coPurchaseMap.get(c._id.toString()) || 0;
    // Boost score: 60% co-purchase + 40% semantic
    const boostedScore = (coCount > 0)
      ? (0.6 * (coCount / Math.max(...coPurchaseMap.values(), 1))) + (0.4 * (c.score || 0.5))
      : (c.score || 0.5) * 0.5; // Reduce score if never bought together
    return { ...c, score: boostedScore, coCount };
  });

  // Sort by boosted score (co-purchase weighted)
  boostedCandidates.sort((a, b) => b.score - a.score);

  // 5. Price filtering
  const avgPrice = calculateAverageCartPrice(cart.products);
  const filteredCandidates = filterByPriceRange(boostedCandidates, avgPrice);

  // 6. AI Reranking with RAG context
  if (filteredCandidates.length > 0 && context) {
    const cartItemsInfo = cartProducts.map(p => ({
      name: p.name,
      categoryName: p.categoryName,
      type: categorizeProduct(p)
    }));

    const aiResults = await aiRerankWithRAG(
      cartItemsInfo,
      filteredCandidates,
      context,
      limit * 2
    );

    if (aiResults.length > 0) {
      return processAIResults(aiResults, filteredCandidates, cartProductIds, limit, context.cart);
    }
  }

  // 7. FALLBACK: Use boosted candidates directly if AI fails
  console.log("[RAG] Using fallback scoring...");
  return filteredCandidates.slice(0, limit).map(c => ({
    productId: c._id.toString(),
    reason: c.coCount > 0 ? "Frequently ordered together" : "Popular item",
    confidence: Math.round(c.score * 100) / 100
  }));
}

/**
 * Process AI results into final recommendations
 */
function processAIResults(aiResults, candidates, cartProductIds, limit, cartInfo) {
  const candidateMap = new Map(
    candidates.map(c => [c._id.toString(), c])
  );

  const finalRecommendations = aiResults
    .map(aiItem => {
      const product = candidateMap.get(aiItem.productId);
      if (!product) return null;

      return {
        productId: aiItem.productId,
        reason: aiItem.reason,
        confidence: 0.95,
        _type: categorizeProduct(product)
      };
    })
    .filter(item => item !== null);

  // Ensure diversity by type
  const inCart = new Set(cartProductIds);
  const pool = finalRecommendations.filter(r => !inCart.has(r.productId));

  const buckets = {
    drink: [],
    side: [],
    dessert: [],
    main: [],
    other: []
  };

  for (const r of pool) {
    (buckets[r._type] || buckets.other).push(r);
  }

  // Prioritize based on cart contents
  const preferred = cartInfo?.hasMain 
    ? ["drink", "side", "dessert", "other", "main"] 
    : ["side", "drink", "dessert", "main", "other"];

  const selected = [];
  for (const t of preferred) {
    if (selected.length >= limit) break;
    const b = buckets[t];
    if (b && b.length) {
      selected.push(b.shift());
    }
  }

  // Fill remaining slots
  if (selected.length < limit) {
    const remaining = pool.filter(r => !selected.find(s => s.productId === r.productId));
    remaining.sort((a, b) => b.confidence - a.confidence);
    while (selected.length < limit && remaining.length) {
      selected.push(remaining.shift());
    }
  }

  return selected.slice(0, limit).map(r => ({
    productId: r.productId,
    reason: r.reason,
    confidence: r.confidence
  }));
}

/**
 * Fallback: Math-based recommendations when RAG fails
 */
async function fallbackRecommendForCart(cart, cartProductIds, limit) {
  console.log("[Fallback] Using math-based scoring...");

  const cartProducts = cart.products
    .map((p) => p.productId)
    .filter((p) => !!p && !!p._id);

  // Calculate average embedding
  const embeddings = [];
  cartProducts.forEach((p) => {
    if (Array.isArray(p.embedding) && p.embedding.length) {
      embeddings.push(p.embedding);
    }
  });

  const avgEmbedding = [];
  if (embeddings.length) {
    const len = embeddings[0].length;
    for (let i = 0; i < len; i++) {
      let sum = 0, count = 0;
      for (const e of embeddings) {
        if (typeof e[i] === "number") { sum += e[i]; count++; }
      }
      avgEmbedding.push(count ? sum / count : 0);
    }
  }

  // Get co-purchase data
  const coPurchaseMap = await getCoPurchaseCountsForProducts(cartProductIds);

  // Fetch available products
  const allProducts = await Product.find({
    stock: { $gt: 0 },
    _id: { $nin: cartProductIds },
  }).lean();

  if (!allProducts.length) return [];

  // Score products
  const scored = allProducts
    .filter(p => p.basePrice)
    .map(p => {
      const similarity = avgEmbedding.length 
        ? Math.max(0, cosineSimilarity(avgEmbedding, p.embedding || []))
        : 0;
      const coCount = coPurchaseMap.get(p._id.toString()) || 0;
      return { product: p, similarity, coCount };
    })
    .filter(c => c.similarity > 0.1 || c.coCount > 0);

  // Normalize and rank
  const maxCo = Math.max(...scored.map(c => c.coCount), 1);
  const maxSim = Math.max(...scored.map(c => c.similarity), 0.1);

  scored.forEach(c => {
    c.score = 0.5 * (c.coCount / maxCo) + 0.5 * (c.similarity / maxSim);
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(c => ({
    productId: c.product._id.toString(),
    reason: "Popular with items in your cart",
    confidence: Math.round(c.score * 100) / 100
  }));
}

/**
 * RAG-Powered Similar Products
 * For product detail page - shows products SIMILAR to what customer is viewing
 */
export async function recommendSimilarToProduct(productId, limit = 5) {
  console.log(`[RAG] Finding similar products for: ${productId}`);

  const baseProduct = await getProductByIdService(productId);
  if (!baseProduct) throw new Error("Product not found");

  // Use RAG retrieval
  const { candidates } = await ragRetrieveForProduct(baseProduct, { limit: limit * 2 });

  if (candidates.length > 0) {
    // Score by SIMILARITY (same category matters most for "similar products")
    const scored = candidates.map(c => {
      const sameCategory = c.categoryId?.toString() === baseProduct.categoryId?.toString();
      // 50% category match + 40% semantic similarity + 10% popularity
      const combinedScore = 
        (sameCategory ? 0.5 : 0) + 
        (c.score || 0.5) * 0.4 +
        0.1;
      return { ...c, combinedScore, sameCategory };
    });

    scored.sort((a, b) => b.combinedScore - a.combinedScore);

    return scored.slice(0, limit).map(c => ({
      productId: c._id.toString(),
      reason: c.sameCategory
        ? "Similar item from the same category"
        : "You might also like",
      confidence: Math.round(c.combinedScore * 100) / 100
    }));
  }

  // Fallback to original algorithm
  console.log("[Fallback] Using legacy similar products algorithm...");
  return await fallbackSimilarProducts(baseProduct, productId, limit);
}

/**
 * Fallback for similar products
 */
async function fallbackSimilarProducts(baseProduct, productId, limit) {
  const allProducts = await Product.find({
    _id: { $ne: productId },
    stock: { $gt: 0 },
  }).lean();

  if (!allProducts.length) return [];

  const baseEmbedding = baseProduct.embedding || [];
  const coPurchaseMap = await getCoPurchaseCountsForProduct(productId);

  const candidatesRaw = allProducts
    .filter(p => p.basePrice)
    .map(p => {
      const sameCategory = baseProduct.categoryId && p.categoryId &&
        p.categoryId.toString() === baseProduct.categoryId.toString();
      const similarity = Math.max(0, cosineSimilarity(baseEmbedding, p.embedding || []));
      const coCount = coPurchaseMap.get(p._id.toString()) || 0;
      return { product: p, sameCategory, similarity, coCount };
    });

  // Normalize and score
  const maxCo = Math.max(...candidatesRaw.map(c => c.coCount), 1);
  const maxSim = Math.max(...candidatesRaw.map(c => c.similarity), 0.1);

  const scored = candidatesRaw.map(c => {
    const coScore = c.coCount / maxCo;
    const simScore = c.similarity / maxSim;
    const catScore = c.sameCategory ? 1 : 0;
    const confidence = 0.5 * catScore + 0.3 * coScore + 0.2 * simScore;
    return { ...c, confidence };
  });

  scored.sort((a, b) => b.confidence - a.confidence);

  return scored.slice(0, limit).map(c => ({
    productId: c.product._id.toString(),
    reason: c.sameCategory ? "Similar item from the same category" : "Frequently viewed together",
    confidence: Math.round(c.confidence * 100) / 100
  }));
}
