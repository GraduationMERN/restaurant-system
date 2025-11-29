import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import requestIdMiddleware from "../../middlewares/requestId.middleware.js";

const router = express.Router();

// Middleware: requestId → optionalAuth → route handler
router.use(requestIdMiddleware);

// ==============================
// CREATE ORDERS
// ==============================
// Guest or logged-in user can create from cart
router.post("/from-cart", optionalAuthMiddleware, orderController.createOrderFromCart);

// Direct order (Points → logged in, Cash walk-in → guest allowed)
router.post("/direct", optionalAuthMiddleware, orderController.createDirectOrder);

// ==============================
// GET ORDERS
// ==============================
// Get single order → guest or user (only their own if user)
router.get("/:id", optionalAuthMiddleware, orderController.getOrder);

// Get orders for a specific user → user only for self, admin/cashier can see all
router.get("/user/:userId", authMiddleware, orderController.getUserOrders);

// Get order by cart ID → optional for guest or user
router.get("/cart/:cartId", optionalAuthMiddleware, orderController.getOrderByCartId);

// Get active orders for kitchen → admin/cashier only
router.get("/kitchen/active", authMiddleware, roleMiddleware("cashier", "admin"), orderController.getActiveOrders);

// ==============================
// UPDATE ORDERS
// ==============================
// Update order status → admin/cashier only
router.patch("/:id/status", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updateOrderStatus);

// Update payment → admin/cashier only
router.patch("/:id/payment", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updatePaymentStatus);

// Update customer info → admin/cashier only
router.patch("/:id/customer-info", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updateCustomerInfo);

// Link guest order to user → admin/cashier only
router.patch("/:id/link-user", authMiddleware, roleMiddleware("cashier", "admin"), orderController.linkUserToOrder);

// ==============================
// CUSTOMER UPDATES (own order)
// ==============================
// Cancel own order → customer only
router.patch("/:id/cancel", authMiddleware, roleMiddleware("customer"), orderController.cancelOrder);

// Update allowed fields of own order → customer only
router.patch("/:id/update", authMiddleware, roleMiddleware("customer"), orderController.updateOwnOrder);

// ==============================
// MANAGEMENT
// ==============================
// Search all orders → admin/cashier only
router.post("/search", authMiddleware, roleMiddleware("cashier", "admin"), orderController.searchOrders);

// Delete order → admin only
router.delete("/:id", authMiddleware, roleMiddleware("admin"), orderController.deleteOrder);

export default router;
