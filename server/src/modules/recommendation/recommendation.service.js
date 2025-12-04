import { getAllProductsWithLean, getProductById } from "../product/product.repository.js";
import OrderService from "../order.module/order.service.js";
import { cosineSimilarity } from "../chat/chat.service.js";
import { env } from "../../config/env.js";

function jaccard(a = [], b = []) {
    const A = new Set(a || []);
    const B = new Set(b || []);
    const intersection = [...A].filter((x) => B.has(x)).length;
    const union = new Set([...(a || []), ...(b || [])]).size;
    return union === 0 ? 0 : intersection / union;
}

function priceProximity(a = 0, b = 0) {
    const diff = Math.abs(a - b);
    const denom = Math.max(a, b, 1);
    const x = diff / denom;
    return 1 - Math.min(x, 1);
}

function scoreProduct(target, p) {
    const emb = cosineSimilarity(target.embedding || [], p.embedding || []);
    const tagScore = jaccard(target.tags || [], p.tags || []);
    const sameCategory = String(p.categoryId) === String(target.categoryId) ? 1 : 0;
    const priceScore = priceProximity(target.basePrice || 0, p.basePrice || 0);
    return emb * 0.8 + tagScore * 0.1 + sameCategory * 0.05 + priceScore * 0.05;
}

function averageEmbedding(list = []) {
    const arrays = list.filter((e) => Array.isArray(e) && e.length > 0);
    if (arrays.length === 0) return [];
    const len = arrays[0].length;
    const sum = new Array(len).fill(0);
    arrays.forEach((arr) => {
        if (arr.length !== len) return;
        for (let i = 0; i < len; i++) sum[i] += arr[i];
    });
    return sum.map((v) => v / arrays.length);
}

export async function recommendSimilarToProduct(productId, limit = env.topK) {
    const target = await getProductById(productId);
    if (!target) throw new Error("Product not found");
    const products = await getAllProductsWithLean();
    const scored = products
        .filter((p) => String(p._id) !== String(target._id))
        .map((p) => ({
            id: p._id,
            name: p.name,
            desc: p.desc,
            basePrice: p.basePrice,
            imgURL: p.imgURL,
            tags: p.tags || [],
            categoryId: p.categoryId,
            stock: p.stock,
            productPoints: p.productPoints,
            isnew: p.isnew,
            score: scoreProduct(target, p),
        }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Number(limit) || env.topK).map((p) => ({
        id: p.id,
        name: p.name,
        desc: p.desc,
        basePrice: p.basePrice,
        imgURL: p.imgURL,
        tags: p.tags,
        categoryId: p.categoryId,
        stock: p.stock,
        productPoints: p.productPoints,
        isnew: p.isnew,
        score: Number(p.score.toFixed(4)),
    }));
    return top;
}

export async function recommendForOrder(orderId, limit = env.topK) {
    const order = await OrderService.getOrder(orderId);
    if (!order) throw new Error("Order not found");
    const productIds = (order.items || [])
        .map((it) => (it.productId ? it.productId._id || it.productId : null))
        .filter(Boolean);
    const allProducts = await getAllProductsWithLean();
    const inOrderSet = new Set(productIds.map((id) => String(id)));
    const orderProducts = allProducts.filter((p) => inOrderSet.has(String(p._id)));
    const targetEmb = averageEmbedding(orderProducts.map((p) => p.embedding || []));
    const tagsUnion = [...new Set(orderProducts.flatMap((p) => p.tags || []))];
    const categoryId = orderProducts[0]?.categoryId || null;
    const priceAvg = orderProducts.length
        ? orderProducts.reduce((s, x) => s + (x.basePrice || 0), 0) / orderProducts.length
        : 0;
    const scored = allProducts
        .filter((p) => !inOrderSet.has(String(p._id)))
        .map((p) => {
            const embScore = cosineSimilarity(targetEmb || [], p.embedding || []);
            const tagScore = jaccard(tagsUnion, p.tags || []);
            const sameCategory = categoryId && String(p.categoryId) === String(categoryId) ? 1 : 0;
            const priceScore = priceProximity(priceAvg, p.basePrice || 0);
            const score = embScore * 0.75 + tagScore * 0.1 + sameCategory * 0.1 + priceScore * 0.05;
            return {
                id: p._id,
                name: p.name,
                desc: p.desc,
                basePrice: p.basePrice,
                imgURL: p.imgURL,
                tags: p.tags || [],
                categoryId: p.categoryId,
                stock: p.stock,
                productPoints: p.productPoints,
                isnew: p.isnew,
                score,
            };
        });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Number(limit) || env.topK).map((p) => ({
        id: p.id,
        name: p.name,
        desc: p.desc,
        basePrice: p.basePrice,
        imgURL: p.imgURL,
        tags: p.tags,
        categoryId: p.categoryId,
        stock: p.stock,
        productPoints: p.productPoints,
        isnew: p.isnew,
        score: Number(p.score.toFixed(4)),
    }));
    return top;
}

