import express from "express";
import * as orderController from "./order.controller.js";

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
router.patch("/:id/status", orderController.updateOrderStatus);      // Update status
router.patch("/:id/payment", orderController.updatePaymentStatus);   // Update payment
router.patch("/:id/customer-info", orderController.updateCustomerInfo); // Update customer info
router.patch("/:id/link-user", orderController.linkUserToOrder);     // Link user to order

// ORDER MANAGEMENT
router.post("/search", orderController.searchOrders);          // Search orders
router.delete("/:id", orderController.deleteOrder);            // Delete order

export default router;