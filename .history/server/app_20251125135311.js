// import express from "express";
// import cors from "cors";
// import morgan from "morgan";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import connectDB from "./src/config/db.js";

// import orderRoutes from "./src/modules/order.module/order.routes.js";
// // import paymentRoutes from "./src/modules/payment.module/payment.routes.js";
// import paymentRoutes from "./src/modules/payment/paymentRoutes.js";
// import reviewRoutes from "./src/routes/review.routes.js";
// import productRoutes from "./src/routes/product.routes.js";
// import rewardRouter from "./src/modules/rewards/reward.routes.js";
// import authRoutes from "./src/routes/auth.routes.js";
// import categoryRoutes from "./src/routes/category.routes.js";
// import cartRoutes from "./src/routes/cart.routes.js";

// dotenv.config();

// const app = express();

// // Global Middlewares
// app.use(cors());
// app.use(express.json()); // for normal routes
// app.use(morgan("dev"));
// app.use(cookieParser());

// // Connect to Database
// await connectDB();

// // Routes
// app.use("/api/reviews", reviewRoutes);
// app.use('/api/products', productRoutes);
// app.use("/api/reward", rewardRouter);
// app.use("/auth", authRoutes);
// app.use('/api/categories', categoryRoutes);

// app.use("/api/orders", orderRoutes);
// app.use("/api/checkout", paymentRoutes); 
// // payment module routes

// // Default Route
// app.get("/", (req, res) => {
//   res.json({ message: "QR Restaurant API is running " });
// });

// // 404 handler
// app.use((req, res, next) => {
//   res.status(404).json({ message: "Route not found", requestId: req.requestId });
// });

// // Global Error Handler
// app.use(errorHandler);


// // startup log



// logger.info('server_initialized', { env: process.env.NODE_ENV || 'development' });


// export default app;
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";

import orderRoutes from "./src/modules/order.module/order.routes.js";
// import paymentRoutes from "./src/modules/payment.module/payment.routes.js";
// import paymentRoutes from "./src/modules/payment/paymentRoutes.js";
import paymentRoutes from "./src/modules/payment/paymentRoutes.js";
// import reviewRoutes from "./src/routes/review.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import rewardRouter from "./src/modules/rewards/reward.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json()); // for normal routes
app.use(morgan("dev"));
app.use(cookieParser());

// Connect to Database
await connectDB();

// Routes
// app.use("/api/reviews", reviewRoutes);
app.use('/api/products', productRoutes);
app.use("/api/reward", rewardRouter);
app.use("/auth", authRoutes);
app.use('/api/categories', categoryRoutes);

app.use("/api/orders", orderRoutes);
app.use("/api/checkout", paymentRoutes); 
// payment module routes
app.use("/api/cart", cartRoutes);
// Default Route
app.get("/", (req, res) => {
  res.json({ message: "QR Restaurant API is running " });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found", requestId: req.requestId });
});

// Global Error Handler
app.use(errorHandler);


// startup log



logger.info('server_initialized', { env: process.env.NODE_ENV || 'development' });


export default app;
