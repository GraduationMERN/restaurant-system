import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), ".env")
});

export const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV || "development",
    jwtKey: process.env.JWT_SECRET,
    refreshJwtKey:process.env.JWT_REFRESH_SECRET,
    tempJwtKey:process.env.JWT_TEMP_SECRET,
    expiry: process.env.ACCESS_JWT_EXPIRES_IN,
    refreshExpiry: process.env.REFRESH_JWT_EXPIRES_IN,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    frontendUrl: process.env.FRONTEND_URL,
    frontDemo: process.env.FRONTEND_DEMO_URL,
    googleId: process.env.GOOGLE_CLIENT_ID,
    googleSecret: process.env.GOOGLE_CLIENT_SECRET,
    serverURI: process.env.GOOGLE_REDIRECT_URI,
    dbName: process.env.DB_NAME,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    // Cloudinary config
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudApiKey: process.env.CLOUDINARY_API_KEY,
    cloudApiSecret: process.env.CLOUDINARY_API_SECRET,
    // for AI
    groqApiKey: process.env.GROQ_API_KEY,
    llmApiUrl: process.env.GROQ_API_URL,
    embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    llmModel: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL,
    topK: parseInt(process.env.TOP_K || '3'),
    firebaseprojectId : process.env.FIREBASE_PROJECT_ID,
    firebaseClientEmail:process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey:process.env.FIREBASE_PRIVATE_KEY

};


// Optional sanity check for missing vars
const required = ["MONGO_URI"];
required.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`Missing required environment variable: ${key}`);
    }
});
