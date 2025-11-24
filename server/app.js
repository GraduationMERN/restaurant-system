import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";

<<<<<<< HEAD
=======
// middlewares
import requestIdMiddleware from "./src/middlewares/requestId.middleware.js";
import requestLogger from "./src/middlewares/requestLogger.middleware.js";
import errorHandler from "./src/middlewares/error.middleware.js";
import logger from "./src/utils/logger.js";

>>>>>>> b8c2fb501a9e71511375eadf4031630528dd6ba9
import orderRoutes from "./src/modules/order.module/order.routes.js";
<<<<<<< HEAD
// import paymentRoutes from "./src/modules/payment.module/payment.routes.js";
import paymentRoutes from "./src/modules/payment/paymentRoutes.js";
=======
// Route imports
import authRoutes from "./src/modules/user/routes/auth.routes.js";
import usersRoutes from "./src/modules/user/routes/user.routes.js";
>>>>>>> 2b28b6f23ebf797cc450f1e7d223a603e0e7c55e
import reviewRoutes from "./src/routes/review.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import rewardRouter from "./src/modules/rewards/reward.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import notificationRoutes from "./src/modules/notification/notification.routes.js";

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors());
<<<<<<< HEAD
app.use(express.json()); // for normal routes
app.use(morgan("dev"));
=======
app.use(express.json());
// Request id and logging
app.use(requestIdMiddleware);
app.use(requestLogger);
// keep morgan for development console-friendly logs
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan("dev"));
}
>>>>>>> b8c2fb501a9e71511375eadf4031630528dd6ba9
app.use(cookieParser());

// Connect to Database
await connectDB();

// Routes
app.use("/api/reviews", reviewRoutes);
app.use('/api/products', productRoutes);
app.use("/api/reward", rewardRouter);
app.use("/auth", authRoutes);
<<<<<<< HEAD
<<<<<<< HEAD
app.use('/api/categories', categoryRoutes);
=======
=======
app.use("/users", usersRoutes);
>>>>>>> 2b28b6f23ebf797cc450f1e7d223a603e0e7c55e
app.use('/api/categories',categoryRoutes);
app.use('/api/cart',cartRoutes);
app.use("/api/notifications", notificationRoutes);


>>>>>>> b8c2fb501a9e71511375eadf4031630528dd6ba9

app.use("/api/orders", orderRoutes);
app.use("/api/checkout", paymentRoutes); 
// payment module routes

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
