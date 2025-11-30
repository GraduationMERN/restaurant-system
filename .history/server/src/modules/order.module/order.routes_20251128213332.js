import express from "express";
// import * as orderController from "./orderController.js";
import * as orderController from "./order.controller.js";

import authMiddleware from "../auth.middleware.js";
import optionalAuthMiddleware from "../optionalAuthMiddleware.js";
import requestIdMiddleware from "../requestIdMiddleware.js";

const router = express.Router();

// Middleware: requestId → optionalAuth → route handler
router.use(requestIdMiddleware);

// CREATE ORDER
router.post("/from-cart", optionalAuthMiddleware, orderController.createOrderFromCart);
router.post("/direct", optionalAuthMiddleware, orderController.createDirectOrder);

// GET ORDERS
router.get("/:id", optionalAuthMiddleware, orderController.getOrder);
router.get("/user/:userId", optionalAuthMiddleware, orderController.getUserOrders);
router.get("/cart/:cartId", optionalAuthMiddleware, orderController.getOrderByCartId);
router.get("/kitchen/active", authMiddleware, orderController.getActiveOrders);

// UPDATE ORDERS
router.patch("/:id/status", authMiddleware, orderController.updateOrderStatus);
router.patch("/:id/payment", authMiddleware, orderController.updatePaymentStatus);
router.patch("/:id/customer-info", authMiddleware, orderController.updateCustomerInfo);
router.patch("/:id/link-user", authMiddleware, orderController.linkUserToOrder);

// MANAGEMENT
router.post("/search", authMiddleware, orderController.searchOrders);
router.delete("/:id", authMiddleware, orderController.deleteOrder);

export default router;
