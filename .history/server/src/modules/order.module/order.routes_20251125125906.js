import express from "express";
import * as orderController from "./order.controller.js";

const router = express.Router();

// CREATE order
router.post("/", orderController.createOrder);

// GET order by ID
router.get("/:id", orderController.getOrderById);

// UPDATE order status
router.patch("/:id/status", orderController.updateOrderStatus);

// UPDATE payment status
router.patch("/:id/payment", orderController.updatePaymentStatus);

// UPDATE customer info
router.patch("/:id/customer-info", orderController.updateCustomerInfo);

// LINK user to order (after registration)
router.patch("/:id/link-user", orderController.linkUserToOrder);

// UPDATE pricing
router.patch("/:id/pricing", orderController.updatePricing);

// ADD item to order
router.patch("/:id/items", orderController.addItemToOrder);

// UPDATE table number
router.patch("/:id/table", orderController.updateTableNumber);

// UPDATE service type
router.patch("/:id/service-type", orderController.updateServiceType);

// GET orders by user
router.get("/user/:userId", orderController.getOrdersByUser);

// GET orders by status
router.get("/status/:status", orderController.getOrdersByStatus);

// GET today's orders
router.get("/analytics/today", orderController.getTodaysOrders);

export default router;