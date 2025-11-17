import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
<<<<<<< HEAD
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    dbName: process.env.DB_NAME,
    nodeEnv: process.env.NODE_ENV || "development",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudApiKey: process.env.CLOUDINARY_API_KEY,
    cloudApiSecret: process.env.CLOUDINARY_API_SECRET,

=======
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtKey: process.env.JWT_SECRET,
  expiry: process.env.JWT_EXPIRES_IN,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
>>>>>>> origin/auth
};

// Optional sanity check for missing vars
const required = ["MONGO_URI"];
required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Missing required environment variable: ${key}`);
  }
});
