import { ChatGroq } from "@langchain/groq";
// 👇 ده الاستيراد الصحيح في التحديثات الجديدة
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { env } from "./env.js";

// Validation
if (!env.groqApiKey) {
    throw new Error("❌ Fatal Error: GROQ_API_KEY is missing in .env");
}

console.log("⚙️  Initializing AI Models (Groq + Official Local Embeddings)...");

// 1. Chat Model (Groq - Llama 3)
export const chatModel = new ChatGroq({
    apiKey: env.groqApiKey,
    model: env.llmModel,
    temperature: 0,
    maxRetries: 2,
});

// 2. Embedding Model (Local - HuggingFace Official)
// بيستخدم نفس الموديل بس عن طريق المكتبة الرسمية
export const embeddingsModel = new HuggingFaceTransformersEmbeddings({
    model: env.embeddingModel,
});