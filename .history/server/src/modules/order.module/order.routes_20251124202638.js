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

// UPDATE reward points
router.patch("/:id/reward", orderController.updateRewardPoints);

// LIST orders for restaurant (support filtering by status & reward)
router.get("/restaurant/:restaurantId", orderController.getOrdersForRestaurant);

// LIST orders for customer (support filtering by reward)
router.get("/customer/:customerId", orderController.getOrdersForCustomer);

export default router;
