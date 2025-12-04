// src/app.js (backend)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import { env } from "./src/config/env.js";
// Middlewares
import requestIdMiddleware from "./src/middlewares/requestId.middleware.js";
import requestLogger from "./src/middlewares/requestLogger.middleware.js";
import errorHandler from "./src/middlewares/error.middleware.js";
import optionalAuthMiddleware from "./src/middlewares/optionalAuthMiddleware.js";
import { stripeWebhookMiddleware } from "./src/modules/payment/stripeWebhookMiddleware.js";
import logger from "./src/utils/logger.js";

// Routes
import orderRoutes from "./src/modules/order.module/order.routes.js";
import paymentRoutes from "./src/modules/payment/paymentRoutes.js";
import authRoutes from "./src/modules/user/routes/auth.routes.js";
import usersRoutes from "./src/modules/user/routes/user.routes.js";
import reviewRoutes from "./src/modules/review/review.routes.js";
import couponRoutes from "./src/modules/coupon/coupon.route.js";
import rewardRouter from "./src/modules/rewards/reward.routes.js";
import notificationRoutes from "./src/modules/notification/notification.routes.js";
import categoryRoutes from "./src/modules/category/category.routes.js";
import cartRoutes from "./src/modules/cart/cart.routes.js";
import productRoutes from "./src/modules/product/product.routes.js";
import chatRoutes from "./src/modules/chat/chat.routes.js";
import restaurantRoutes from "./src/modules/restaurant/restaurant.route.js";
import { initializeEmbeddingModel } from "./src/modules/chat/chat.service.js";

// Import PaymentController if needed
import PaymentController from "./src/modules/payment/paymentController.js";

dotenv.config();
const app = express();

// --- Global Middlewares ---

app.use(cors({
  origin: ["http://localhost:5173","https://brandbite-three.vercel.app",env.frontendUrl],
  credentials: true,
}));

app.options("/", cors()); // Handle preflight for all routes

// IMPORTANT: Webhook needs raw body, so handle it BEFORE express.json()
app.post(
  "/api/checkout/webhook",
  express.raw({ type: "application/json" }), // Use raw body for webhook
  stripeWebhookMiddleware,
  PaymentController.handleWebhook
);

// Now apply regular JSON parsing for other routes
app.use(express.json());
app.use(cookieParser());
app.use(requestIdMiddleware);
// app.use(requestLogger);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan("dev"));
}

// --- Connect to Database ---
await connectDB();

// --- Initialize AI chatbot ---
initializeEmbeddingModel();

// --- API Routes ---
app.use("/api", couponRoutes);
app.use("/api/chatBot", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reward", rewardRouter);
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", optionalAuthMiddleware, cartRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurant", restaurantRoutes);
// Payment routes - this mounts routes from paymentRoutes.js
app.use("/api/checkout", paymentRoutes);

// --- Default Route ---
app.get("/", (req, res) => {
  res.json({ message: "QR Restaurant API is running" });
});

// --- 404 Handler ---
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found", requestId: req.requestId });
});

// --- Global Error Handler ---
app.use(errorHandler);

// --- Startup Log ---
// logger.info("server_initialized", { env: process.env.NODE_ENV || "development" });

export default app;