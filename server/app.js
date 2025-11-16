// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import connectDB from "./src/config/db.js";

// Route imports
import reviewRoutes from "./src/routes/review.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import rewardRouter from "./src/modules/rewards/reward.routes.js";


dotenv.config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Connect to Database
await connectDB();

// Routes
app.use("/api/reviews", reviewRoutes);
app.use('/api/products',productRoutes);
app.use("/api/reward",rewardRouter)


// Default Route
app.get("/", (req, res) => {
  res.json({ message: "QR Restaurant API is running " });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
