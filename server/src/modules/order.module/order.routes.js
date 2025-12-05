import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

// ============= PUBLIC/GUEST ROUTES =============
router.post("/from-cart", optionalAuthMiddleware, orderController.createOrderFromCart);
router.post("/direct", optionalAuthMiddleware, orderController.createDirectOrder);
router.get("/session/:sessionId", optionalAuthMiddleware, orderController.getOrderByStripeSession);
router.get("/:id", optionalAuthMiddleware, orderController.getOrder);
router.get("/user/:userId", optionalAuthMiddleware, orderController.getUserOrders);
router.patch("/:id/cancel", optionalAuthMiddleware, orderController.cancelOrder);
router.patch("/:id/payment", optionalAuthMiddleware, orderController.updatePaymentStatus);

// ============= CUSTOMER ROUTES =============
// (Protected by authMiddleware - logged in users only)

// ============= CASHIER ROUTES =============
router.get("/kitchen/active", authMiddleware, roleMiddleware("cashier", "admin", "kitchen"), orderController.getActiveOrders);
router.patch("/:id/status", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updateOrderStatus);

// ============= ADMIN ROUTES =============
router.get("/", authMiddleware, roleMiddleware("admin", "cashier"), orderController.getAllOrders);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "cashier"), orderController.deleteOrder);

export default router;