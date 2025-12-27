import mongoose from "mongoose";
import { env } from "./env.js"; // import centralized env config

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      dbName: env.dbName || "brandbite",
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1); // Stop the app if DB connection fails
  }
};

export default connectDB;
