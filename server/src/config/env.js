import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), ".env")
});

export const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    dbName: process.env.DB_NAME,
    nodeEnv: process.env.NODE_ENV || "development",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudApiKey: process.env.CLOUDINARY_API_KEY,
    cloudApiSecret: process.env.CLOUDINARY_API_SECRET,

    // for AI
    groqApiKey: process.env.GROQ_API_KEY,
    llmApiUrl: process.env.GROQ_API_URL,
    embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    llmModel: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
    topK: parseInt(process.env.TOP_K || '3'),

};

// Optional sanity check for missing vars
const required = ["MONGO_URI"];
required.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`Missing required environment variable: ${key}`);
    }
});