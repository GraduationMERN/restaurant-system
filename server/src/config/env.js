import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV || "development",
};

// Optional sanity check for missing vars
const required = ["MONGO_URI"];
required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Missing required environment variable: ${key}`);
  }
});
