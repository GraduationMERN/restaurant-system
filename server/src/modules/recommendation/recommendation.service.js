import mongoose from "mongoose";
import Product from "../product/Product.js";
import Order from "../order.module/orderModel.js";
import { getCartForUserService } from "../cart/cart.service.js";
import { getProductByIdService } from "../product/product.service.js";

// --- LangChain & AI Imports ---
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// Initialize OpenAI Model
// We use temperature 0.2 to ensure consistent JSON formatting
const llm = new ChatGroq({
  model: "llama-3.1-70b-versatile",
  temperature: 0.2,
  apiKey: process.env.GROQ_API_KEY,
});

// --- AI Configuration: Output Schema ---
// This guarantees the AI returns valid JSON matching our frontend needs
const RecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      productId: z.string().describe("The exact Mongo ID of the recommended product from the candidates list"),
      reason: z.string().describe("A short, persuasive marketing reason (max 1 sentence) explaining why this item pairs well with the user's current cart."),
    })
  ).describe("A list of the top 3 most relevant recommended products"),
});

// ==========================================
// SECTION 1: Mathematical Helper Functions
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

function categorizeProductName(nameLike) {
  const t = String(nameLike || "").toLowerCase();
  if (/(juice|drink|beverage|soda|cola|tea|coffee)/.test(t)) return "drink";
  if (/(dessert|sweet|cake|ice cream|pie|pudding|brownie|cookie)/.test(t)) return "dessert";
  if (/(fries|side|salad|soup|appetizer|starter|dip|sauce|bread)/.test(t)) return "side";
  if (/(burger|pizza|sandwich|shawarma|wrap|meal|plate|steak|pasta|rice|chicken|beef)/.test(t)) return "main";
  return "other";
}

// Get how many times a product was bought with other items (Co-occurrence)
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
// SECTION 2: AI Integration (LangChain)
// ==========================================

/**
 * Uses LangChain to re-rank the mathematically filtered candidates.
 * It selects items that semantically complement the cart (e.g., Burger -> Fries/Drink).
 */
async function aiRerankForCart(cartItems, candidates, limitParam = 6) {
  if (!candidates.length) return [];

  // 1. Prepare context for the prompt
  const cartDescription = cartItems
    .map((p) => `- ${p.name} (Category: ${p.categoryName || "General"}, Type: ${p.type || "other"})`)
    .join("\n");

  const candidatesDescription = candidates
    .map((c) => `ID: ${c.product._id} | Name: ${c.product.name} | Category: ${c.product.categoryName || "General"} | Type: ${c.typeHint || "other"} | Price: ${c.product.basePrice}`)
    .join("\n");

  // 2. Define the Prompt Template
  const promptTemplate = PromptTemplate.fromTemplate(`
    You are an expert restaurant waiter and sales AI.
    
    CURRENT USER CART:
    {cart}

    AVAILABLE CANDIDATE ITEMS (Pre-filtered):
    {candidates}

    TASK:
    Select up to {limit} items from the "Candidates" list that best COMPLEMENT the "User Cart".
    - Focus on cross-selling: If they have food, suggest drinks, sides, or desserts.
    - Avoid redundancy: Do not suggest a main dish if they already have one, unless it's a family order.
    - Ensure diversity: Prefer a balanced mix (e.g., drink + side + dessert) when mains are present.
    - Provide a short, appetizing reason for each recommendation.

    Return the result strictly in JSON format.
  `);

  // 3. Bind the model with the Zod schema for structured output
  const structuredLlm = llm.withStructuredOutput(RecommendationSchema);
  const chain = promptTemplate.pipe(structuredLlm);

  try {
    // 4. Invoke the AI Chain
    const result = await chain.invoke({
      cart: cartDescription,
      candidates: candidatesDescription,
      limit: Math.max(3, Math.min(12, Number(limitParam) || 6)),
    });

    return result.recommendations || [];
  } catch (error) {
    console.error("LangChain Rerank Failed:", error);
    return []; // Return empty to trigger fallback
  }
}

// ==========================================
// SECTION 3: Main Exported Services
// ==========================================

/**
 * Strategy: "Retrieve & Rerank"
 * 1. Retrieve: Use Math (Co-occurrence + Similarity) to get top 15 relevant items.
 * 2. Rerank: Use AI to pick the best 3 complementary items from those 15.
 */
export async function recommendForCart(userId, limit = 3) {
  // 1. Fetch User Cart
  const cart = await getCartForUserService(userId);
  if (!cart || !cart.products || !cart.products.length) return [];

  const cartProducts = cart.products
    .map((p) => p.productId)
    .filter((p) => !!p && !!p._id);

  if (!cartProducts.length) return [];
  const cartProductIds = cartProducts.map((p) => p._id.toString());

  // 2. Calculate Cart Average Embedding (Math)
  const embeddings = [];
  cartProducts.forEach((p) => {
    if (Array.isArray(p.embedding) && p.embedding.length) embeddings.push(p.embedding);
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

  // 3. Get Co-purchase data (Math)
  const coPurchaseMap = await getCoPurchaseCountsForProducts(cartProductIds);

  // 4. Fetch All Available Products (excluding what's in cart)
  const allProducts = await Product.find({
    stock: { $gt: 0 },
    _id: { $nin: cartProductIds },
  }).lean();

  if (!allProducts.length) return [];

  const cartCategoryIds = new Set(
    cartProducts
      .map((p) => (p.categoryId ? p.categoryId.toString() : null))
      .filter(Boolean)
  );
  const cartTypes = cartProducts.map((p) =>
    categorizeProductName((p.categoryName || "") + " " + (p.name || ""))
  );
  const cartHasMain = cartTypes.includes("main");
  let avgPrice = 0;
  let priceCount = 0;
  for (const cp of cart.products) {
    const price = cp?.productId?.basePrice || 0;
    const qty = cp?.quantity || 1;
    if (price > 0) {
      avgPrice += price * qty;
      priceCount += qty;
    }
  }
  avgPrice = priceCount > 0 ? avgPrice / priceCount : 0;

  const candidatesStage1 = [];
  for (const p of allProducts) {
    if (!p.basePrice) continue;
    let similarity = cosineSimilarity(avgEmbedding, p.embedding || []);
    if (similarity < 0) similarity = 0;
    const coCount = coPurchaseMap.get(p._id.toString()) || 0;
    const sameCategoryInCart =
      p.categoryId && cartCategoryIds.has(p.categoryId.toString());
    const diversity = sameCategoryInCart ? 0 : 1;
    const typeHint = categorizeProductName((p.categoryName || "") + " " + (p.name || ""));
    if (similarity > 0.15 || coCount > 0) {
      candidatesStage1.push({ product: p, similarity, coCount, diversity, typeHint });
    }
  }
  const maxCo = Math.max(...candidatesStage1.map((c) => c.coCount), 0);
  const maxSim = Math.max(...candidatesStage1.map((c) => c.similarity), 0);
  const candidatesRaw = candidatesStage1.map((c) => {
    const coScore = maxCo > 0 ? c.coCount / maxCo : 0;
    const simScore = maxSim > 0 ? c.similarity / maxSim : 0;
    let modifier = 1;
    if (avgPrice > 0) {
      const ratio = c.product.basePrice / avgPrice;
      if (ratio > 2.5) modifier *= 0.7;
      else if (ratio < 0.25) modifier *= 0.85;
    }
    let complementBoost = 1;
    if (cartHasMain) {
      if (c.typeHint === "drink" || c.typeHint === "dessert" || c.typeHint === "side") complementBoost = 1.25;
      if (c.typeHint === "main") complementBoost = 0.85;
    }
    const retrievalScore = (0.4 * coScore + 0.4 * simScore + 0.2 * c.diversity) * modifier * complementBoost;
    return { ...c, retrievalScore };
  });
  candidatesRaw.sort((a, b) => b.retrievalScore - a.retrievalScore);
  const topCandidatesForAI = candidatesRaw.slice(0, 30);

  // 6. AI Reranking Step
  const cartItemsInfo = cartProducts.map(p => ({
    name: p.name,
    categoryName: p.categoryName,
    type: categorizeProductName((p.categoryName || "") + " " + (p.name || ""))
  }));

  const aiResults = await aiRerankForCart(cartItemsInfo, topCandidatesForAI, limit * 2);

  // 7. Process AI Results
  if (aiResults.length > 0) {
    const finalRecommendationsRaw = aiResults.map(aiItem => {
      // Find the full product object from our list
      const originalCandidate = topCandidatesForAI.find(c => c.product._id.toString() === aiItem.productId);

      if (!originalCandidate) return null;

      return {
        productId: originalCandidate.product._id.toString(),
        reason: aiItem.reason, // The AI-generated reason
        confidence: 0.95, // High confidence because AI selected it
        _type: originalCandidate.typeHint || "other"
      };
    }).filter(item => item !== null);

    const inCart = new Set(cartProductIds);
    const pool = finalRecommendationsRaw.filter(r => !inCart.has(r.productId));
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
    const preferred = cartHasMain ? ["drink", "side", "dessert", "other", "main"] : ["side", "drink", "dessert", "main", "other"];
    const selected = [];
    for (const t of preferred) {
      if (selected.length >= limit) break;
      const b = buckets[t];
      if (b && b.length) {
        selected.push(b.shift());
      }
    }
    if (selected.length < limit) {
      const remaining = pool.filter(r => !selected.find(s => s.productId === r.productId));
      remaining.sort((a, b) => b.confidence - a.confidence);
      while (selected.length < limit && remaining.length) {
        selected.push(remaining.shift());
      }
    }
    if (selected.length < limit) {
      const pickedIds = new Set(selected.map(r => r.productId));
      const fillers = candidatesRaw
        .filter(c => !inCart.has(c.product._id.toString()) && !pickedIds.has(c.product._id.toString()))
        .slice(0, limit - selected.length)
        .map(c => ({
          productId: c.product._id.toString(),
          reason: "Popular with items in your cart",
          confidence: 0.7
        }));
      selected.push(...fillers);
    }
    return selected.slice(0, limit).map(r => ({ productId: r.productId, reason: r.reason, confidence: r.confidence }));
  }

  // 8. FALLBACK: If AI fails or returns nothing, use Math scores
  // Simple heuristic reason for fallback
  return topCandidatesForAI.slice(0, limit).map((c) => ({
    productId: c.product._id.toString(),
    reason: "Popular with items in your cart",
    confidence: 0.6
  }));
}

/**
 * Standard Product-to-Product recommendation.
 * Kept purely mathematical for speed on "Product Details" pages.
 */
export async function recommendSimilarToProduct(productId, limit = 5) {
  const baseProduct = await getProductByIdService(productId);
  if (!baseProduct) throw new Error("Product not found");

  const allProducts = await Product.find({
    _id: { $ne: productId },
    stock: { $gt: 0 },
  }).lean();

  if (!allProducts.length) return [];

  const baseEmbedding = baseProduct.embedding || [];
  const coPurchaseMap = await getCoPurchaseCountsForProduct(productId);
  const candidatesRaw = [];

  for (const p of allProducts) {
    if (!p.basePrice) continue;

    const sameCategory = baseProduct.categoryId && p.categoryId &&
      p.categoryId.toString() === baseProduct.categoryId.toString();

    let similarity = cosineSimilarity(baseEmbedding, p.embedding || []);
    if (similarity < 0) similarity = 0;

    const coCount = coPurchaseMap.get(p._id.toString()) || 0;

    candidatesRaw.push({ product: p, sameCategory, similarity, coCount });
  }

  // Normalize and Score
  const coValues = candidatesRaw.map((c) => c.coCount);
  const maxCo = Math.max(...coValues, 0);
  const simValues = candidatesRaw.map((c) => c.similarity);
  const maxSim = Math.max(...simValues, 0);

  const scored = candidatesRaw.map((c) => {
    const coScore = maxCo > 0 ? c.coCount / maxCo : 0;
    const similarityScore = maxSim > 0 ? c.similarity / maxSim : 0;
    const categoryScore = c.sameCategory ? 1 : 0;

    // Weight: Category (high), Similarity (medium), Co-purchase (medium)
    // For similar items, we WANT same category.
    let confidence = 0.5 * categoryScore + 0.3 * coScore + 0.2 * similarityScore;

    return { ...c, confidence };
  });

  scored.sort((a, b) => b.confidence - a.confidence);

  // Helper for static reasons
  const buildStaticReason = (candidate) => {
    if (candidate.sameCategory) return "Similar item from the same category";
    return "Frequently viewed together";
  };

  return scored.slice(0, limit).map((c) => ({
    productId: c.product._id.toString(),
    reason: buildStaticReason(c),
    confidence: Number(c.confidence.toFixed(2)),
  }));
}
