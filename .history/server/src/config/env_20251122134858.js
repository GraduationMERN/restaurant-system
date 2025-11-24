import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), ".env")
});

export const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV || "development",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudApiKey: process.env.CLOUDINARY_API_KEY,
    cloudApiSecret: process.env.CLOUDINARY_API_SECRET,
    STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET : process.env.STRIPE_WEBHOOK_SECRET,


};

// Optional sanity check for missing vars
const required = ["MONGO_URI"];
required.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`Missing required environment variable: ${key}`);
    }
});