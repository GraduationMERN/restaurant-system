import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

// ORDER CREATION
router.post("/from-cart", orderController.createOrderFromCart); // Create from cart
router.post("/direct", orderController.createDirectOrder);     // Create direct order

// ORDER RETRIEVAL
router.get("/:id", orderController.getOrder);                  // Get order by ID
router.get("/user/:userId", orderController.getUserOrders);    // Get user orders
router.get("/cart/:cartId", orderController.getOrderByCartId); // Get order by cart ID
router.get("/kitchen/active", orderController.getActiveOrders); // Get active orders

// ORDER UPDATES
router.patch("/:id/status", authMiddleware, roleMiddleware("admin", "kitchen", "cashier"), orderController.updateOrderStatus);      // Update status
router.patch("/:id/payment", authMiddleware, roleMiddleware("admin", "cashier"), orderController.updatePaymentStatus);   // Update payment
router.patch("/:id/customer-info", authMiddleware, roleMiddleware("admin"), orderController.updateCustomerInfo); // Update customer info
router.patch("/:id/link-user", authMiddleware, roleMiddleware("admin"), orderController.linkUserToOrder);     // Link user to order

// ORDER MANAGEMENT
router.post("/search", orderController.searchOrders);          // Search orders
router.delete("/:id", orderController.deleteOrder);            // Delete order

export default router;