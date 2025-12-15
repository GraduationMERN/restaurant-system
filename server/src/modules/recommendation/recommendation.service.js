import Product from "../product/Product.js";
import Category from "../category/Category.js";
import { getCartForUserService } from "../cart/cart.service.js";
import { getProductByIdService } from "../product/product.service.js";

const CATEGORY_TYPES = {
  MAIN: "MAIN",
  SIDE: "SIDE",
  DRINK: "DRINK",
  DESSERT: "DESSERT",
  OTHER: "OTHER",
};

const TARGET_CANDIDATES_MIN = 8;
const TARGET_CANDIDATES_MAX = 12;

function inferCategoryType(name) {
  if (!name) return CATEGORY_TYPES.OTHER;
  const n = name.toLowerCase();
  if (
    n.includes("drink") ||
    n.includes("juice") ||
    n.includes("beverage") ||
    n.includes("coffee") ||
    n.includes("tea") ||
    n.includes("soda")
  ) {
    return CATEGORY_TYPES.DRINK;
  }
  if (
    n.includes("side") ||
    n.includes("fries") ||
    n.includes("starter") ||
    n.includes("appetizer") ||
    n.includes("salad")
  ) {
    return CATEGORY_TYPES.SIDE;
  }
  if (
    n.includes("dessert") ||
    n.includes("sweet") ||
    n.includes("cake") ||
    n.includes("ice cream") ||
    n.includes("ice-cream")
  ) {
    return CATEGORY_TYPES.DESSERT;
  }
  return CATEGORY_TYPES.MAIN;
}

async function buildCategoryTypeMap() {
  const categories = await Category.find({}).lean();
  const map = new Map();
  for (const c of categories) {
    map.set(c._id.toString(), inferCategoryType(c.name));
  }
  return map;
}

function getCategoryType(categoryId, categoryTypeMap) {
  if (!categoryId) return CATEGORY_TYPES.OTHER;
  const key = categoryId.toString();
  return categoryTypeMap.get(key) || CATEGORY_TYPES.OTHER;
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const len = Math.min(a.length, b.length);
  if (!len) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalizeScore(value, min, max) {
  if (max <= min) return 0;
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
}

function computePricePenalty(basePrice, candidatePrice) {
  if (!basePrice || !candidatePrice) return 0;
  const ratio = candidatePrice / basePrice;
  if (ratio <= 1.1) return 0;
  if (ratio >= 2) return 1;
  return (ratio - 1.1) / (2 - 1.1);
}

function computeComplementarityForProduct(baseType, candidateType) {
  if (baseType === CATEGORY_TYPES.MAIN) {
    if (candidateType === CATEGORY_TYPES.SIDE) return 1;
    if (candidateType === CATEGORY_TYPES.DRINK) return 0.9;
    if (candidateType === CATEGORY_TYPES.DESSERT) return 0.8;
    if (candidateType === CATEGORY_TYPES.MAIN) return 0.3;
    return 0.2;
  }
  if (baseType === CATEGORY_TYPES.DRINK) {
    if (candidateType === CATEGORY_TYPES.DESSERT) return 0.9;
    if (candidateType === CATEGORY_TYPES.SIDE) return 0.7;
    if (candidateType === CATEGORY_TYPES.MAIN) return 0.4;
    return 0.3;
  }
  if (baseType === CATEGORY_TYPES.DESSERT) {
    if (candidateType === CATEGORY_TYPES.DRINK) return 0.9;
    if (candidateType === CATEGORY_TYPES.SIDE) return 0.6;
    return 0.3;
  }
  if (baseType === CATEGORY_TYPES.SIDE) {
    if (candidateType === CATEGORY_TYPES.MAIN) return 0.8;
    if (candidateType === CATEGORY_TYPES.DRINK) return 0.7;
    return 0.4;
  }
  return 0.4;
}

function computeComplementarityForCart(candidateType, missingTypes, presentTypes) {
  if (candidateType === CATEGORY_TYPES.MAIN) return 0;
  if (missingTypes.has(candidateType)) return 1;
  if (!presentTypes.has(candidateType)) return 0.7;
  return 0.4;
}

function computeTagScore(baseTagsSet, candidateTagsSet, candidateType, mode) {
  let score = 0;
  const hasSpicy = baseTagsSet.has("spicy");
  const hasVegan = baseTagsSet.has("vegan");
  const coolingTags = new Set([
    "cooling",
    "refreshing",
    "cold_drink",
    "soft_drink",
    "juice",
    "smoothie",
    "yogurt",
    "milkshake",
  ]);
  const isCoolingDrink =
    candidateType === CATEGORY_TYPES.DRINK &&
    Array.from(candidateTagsSet).some((t) => coolingTags.has(t));
  if (hasSpicy && isCoolingDrink) {
    score += mode === "cart" ? 0.9 : 1;
  }
  const candidateIsVegan = candidateTagsSet.has("vegan");
  if (hasVegan && candidateIsVegan) {
    score += 0.8;
  }
  if (candidateTagsSet.has("best_seller")) {
    score += 0.4;
  }
  return Math.min(score, 1);
}

function computeFinalScore(params) {
  const {
    complementarity,
    similarity,
    productPointsNorm,
    tagScore,
    isNew,
    pricePenalty,
  } = params;
  const baseScore =
    0.4 * complementarity +
    0.3 * similarity +
    0.2 * productPointsNorm +
    0.1 * tagScore;
  const newBoost = isNew ? 0.05 : 0;
  const penalty = 0.15 * pricePenalty;
  return baseScore + newBoost - penalty;
}

function buildReasonForProduct(baseProduct, candidate, baseType, candidateType) {
  const baseTags = new Set((baseProduct.tags || []).map((t) => t.toLowerCase()));
  const candidateTags = new Set(
    (candidate.tags || []).map((t) => t.toLowerCase())
  );
  const hasSpicy = baseTags.has("spicy");
  const hasVegan = baseTags.has("vegan");
  const candidateIsVegan = candidateTags.has("vegan");
  const isBestSeller = candidateTags.has("best_seller");
  if (hasSpicy && candidateType === CATEGORY_TYPES.DRINK) {
    return "This drink balances the spiciness of your meal and is often chosen together.";
  }
  if (baseType === CATEGORY_TYPES.MAIN && candidateType === CATEGORY_TYPES.SIDE) {
    return "This side completes your main dish and is a frequent pairing.";
  }
  if (baseType === CATEGORY_TYPES.MAIN && candidateType === CATEGORY_TYPES.DRINK) {
    return "This drink pairs well with your main and keeps the meal balanced.";
  }
  if (candidateType === CATEGORY_TYPES.DESSERT) {
    return "This dessert adds a sweet finish that complements your current choice.";
  }
  if (hasVegan && candidateIsVegan) {
    return "This keeps your meal fully vegan while adding more variety.";
  }
  if (isBestSeller) {
    return "This is a popular choice that works well with similar orders.";
  }
  return "This item is a good match that complements what you are viewing.";
}

function buildReasonForCart(candidate, candidateType, missingTypes, baseTagsSet) {
  const candidateTags = new Set(
    (candidate.tags || []).map((t) => t.toLowerCase())
  );
  const hasSpicy = baseTagsSet.has("spicy");
  const hasVegan = baseTagsSet.has("vegan");
  const candidateIsVegan = candidateTags.has("vegan");
  if (candidateType === CATEGORY_TYPES.DRINK && missingTypes.has(CATEGORY_TYPES.DRINK)) {
    if (hasSpicy) {
      return "This drink cools down spicy dishes and completes your order.";
    }
    return "Adds a refreshing drink to complete your meal.";
  }
  if (candidateType === CATEGORY_TYPES.SIDE && missingTypes.has(CATEGORY_TYPES.SIDE)) {
    return "Adds a side dish that boosts variety without changing your main choices.";
  }
  if (candidateType === CATEGORY_TYPES.DESSERT && missingTypes.has(CATEGORY_TYPES.DESSERT)) {
    return "Adds a light dessert to finish your meal on a sweet note.";
  }
  if (hasVegan && candidateIsVegan) {
    return "Keeps your order fully vegan while increasing portion variety.";
  }
  if (candidateTags.has("best_seller")) {
    return "This is a guest favorite that fits nicely with your cart.";
  }
  return "This item increases variety in your cart without overwhelming the order.";
}

function trimCandidates(candidates) {
  if (candidates.length <= TARGET_CANDIDATES_MAX) {
    return candidates;
  }
  return candidates.slice(0, TARGET_CANDIDATES_MAX);
}

export async function recommendSimilarToProduct(productId, limit = 4) {
  const baseProduct = await getProductByIdService(productId);
  if (!baseProduct) {
    throw new Error("Product not found");
  }
  const categoryTypeMap = await buildCategoryTypeMap();
  const baseType = getCategoryType(baseProduct.categoryId, categoryTypeMap);
  const allProducts = await Product.find({
    _id: { $ne: productId },
    stock: { $gt: 0 },
  }).lean();
  const baseEmbedding = baseProduct.embedding || [];
  const basePrice = baseProduct.basePrice || 0;
  const baseTagsSet = new Set(
    (baseProduct.tags || []).map((t) => t.toLowerCase())
  );
  const candidatesRaw = [];
  for (const p of allProducts) {
    if (!p || !p._id) continue;
    if (!p.basePrice || p.stock <= 0) continue;
    const candidateType = getCategoryType(p.categoryId, categoryTypeMap);
    const pricePenalty = computePricePenalty(basePrice, p.basePrice);
    if (basePrice && p.basePrice > basePrice * 2) continue;
    const similarity = cosineSimilarity(baseEmbedding, p.embedding || []);
    const complementarity = computeComplementarityForProduct(
      baseType,
      candidateType
    );
    const candidateTagsSet = new Set(
      (p.tags || []).map((t) => t.toLowerCase())
    );
    const tagScore = computeTagScore(
      baseTagsSet,
      candidateTagsSet,
      candidateType,
      "product"
    );
    const points = typeof p.productPoints === "number" ? p.productPoints : 0;
    candidatesRaw.push({
      product: p,
      candidateType,
      similarity,
      complementarity,
      tagScore,
      pricePenalty,
      productPoints: points,
      isNew: !!p.isnew,
    });
  }
  if (!candidatesRaw.length) {
    return [];
  }
  const pointsValues = candidatesRaw.map((c) => c.productPoints || 0);
  const minPoints = Math.min(...pointsValues);
  const maxPoints = Math.max(...pointsValues);
  const scored = candidatesRaw.map((c) => {
    const productPointsNorm = normalizeScore(
      c.productPoints,
      minPoints,
      maxPoints
    );
    const finalScore = computeFinalScore({
      complementarity: c.complementarity,
      similarity: c.similarity,
      productPointsNorm,
      tagScore: c.tagScore,
      isNew: c.isNew,
      pricePenalty: c.pricePenalty,
    });
    return {
      ...c,
      productPointsNorm,
      finalScore,
    };
  });
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const trimmed = trimCandidates(scored);
  const effectiveCandidates =
    trimmed.length >= TARGET_CANDIDATES_MIN ? trimmed : scored;
  const top = effectiveCandidates.slice(0, Math.max(3, Math.min(4, limit)));
  return top.map((c) => ({
    _id: c.product._id.toString(),
    name: c.product.name,
    basePrice: c.product.basePrice,
    imgURL: c.product.imgURL,
    reason: buildReasonForProduct(
      baseProduct,
      c.product,
      baseType,
      c.candidateType
    ),
  }));
}

export async function recommendForCart(userId, limit = 3) {
  const cart = await getCartForUserService(userId);
  if (!cart || !cart.products || !cart.products.length) {
    return [];
  }
  const categoryTypeMap = await buildCategoryTypeMap();
  const cartProducts = cart.products
    .map((p) => p.productId)
    .filter((p) => !!p && !!p._id);
  if (!cartProducts.length) {
    return [];
  }
  const cartProductIds = new Set(
    cartProducts.map((p) => p._id.toString())
  );
  const baseTagsSet = new Set();
  const presentTypes = new Set();
  const mainPrices = [];
  const embeddings = [];
  for (const p of cartProducts) {
    (p.tags || []).forEach((t) => baseTagsSet.add(t.toLowerCase()));
    const t = getCategoryType(p.categoryId, categoryTypeMap);
    presentTypes.add(t);
    if (t === CATEGORY_TYPES.MAIN && typeof p.basePrice === "number") {
      mainPrices.push(p.basePrice);
    }
    if (Array.isArray(p.embedding) && p.embedding.length) {
      embeddings.push(p.embedding);
    }
  }
  const avgEmbedding = [];
  if (embeddings.length) {
    const length = embeddings[0].length;
    for (let i = 0; i < length; i += 1) {
      let sum = 0;
      let count = 0;
      for (const e of embeddings) {
        if (typeof e[i] === "number") {
          sum += e[i];
          count += 1;
        }
      }
      avgEmbedding.push(count ? sum / count : 0);
    }
  }
  const avgMainPrice =
    mainPrices.length > 0
      ? mainPrices.reduce((a, b) => a + b, 0) / mainPrices.length
      : null;
  const missingTypes = new Set();
  [CATEGORY_TYPES.DRINK, CATEGORY_TYPES.SIDE, CATEGORY_TYPES.DESSERT].forEach(
    (t) => {
      if (!presentTypes.has(t)) {
        missingTypes.add(t);
      }
    }
  );
  const allProducts = await Product.find({
    stock: { $gt: 0 },
  }).lean();
  const candidatesRaw = [];
  for (const p of allProducts) {
    if (!p || !p._id) continue;
    if (cartProductIds.has(p._id.toString())) continue;
    if (!p.basePrice || p.stock <= 0) continue;
    const candidateType = getCategoryType(p.categoryId, categoryTypeMap);
    if (candidateType === CATEGORY_TYPES.MAIN) continue;
    if (avgMainPrice && p.basePrice > avgMainPrice * 2) continue;
    const similarity = cosineSimilarity(avgEmbedding, p.embedding || []);
    const complementarity = computeComplementarityForCart(
      candidateType,
      missingTypes,
      presentTypes
    );
    const candidateTagsSet = new Set(
      (p.tags || []).map((t) => t.toLowerCase())
    );
    const tagScore = computeTagScore(
      baseTagsSet,
      candidateTagsSet,
      candidateType,
      "cart"
    );
    const points = typeof p.productPoints === "number" ? p.productPoints : 0;
    const pricePenalty =
      avgMainPrice && avgMainPrice > 0
        ? computePricePenalty(avgMainPrice, p.basePrice)
        : 0;
    candidatesRaw.push({
      product: p,
      candidateType,
      similarity,
      complementarity,
      tagScore,
      pricePenalty,
      productPoints: points,
      isNew: !!p.isnew,
    });
  }
  if (!candidatesRaw.length) {
    return [];
  }
  const pointsValues = candidatesRaw.map((c) => c.productPoints || 0);
  const minPoints = Math.min(...pointsValues);
  const maxPoints = Math.max(...pointsValues);
  const scored = candidatesRaw.map((c) => {
    const productPointsNorm = normalizeScore(
      c.productPoints,
      minPoints,
      maxPoints
    );
    const finalScore = computeFinalScore({
      complementarity: c.complementarity,
      similarity: c.similarity,
      productPointsNorm,
      tagScore: c.tagScore,
      isNew: c.isNew,
      pricePenalty: c.pricePenalty,
    });
    return {
      ...c,
      productPointsNorm,
      finalScore,
    };
  });
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const trimmed = trimCandidates(scored);
  const effectiveCandidates =
    trimmed.length >= TARGET_CANDIDATES_MIN ? trimmed : scored;
  const top = effectiveCandidates.slice(0, Math.max(2, Math.min(3, limit)));
  return top.map((c) => ({
    _id: c.product._id.toString(),
    name: c.product.name,
    basePrice: c.product.basePrice,
    imgURL: c.product.imgURL,
    reason: buildReasonForCart(
      c.product,
      c.candidateType,
      missingTypes,
      baseTagsSet
    ),
  }));
}
