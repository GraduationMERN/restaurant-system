import express from "express";
import * as orderController from "./orderController.js";

const router = express.Router();

// CREATE order
router.post("/", orderController.createOrder);

// GET order by id
router.get("/:id", orderController.getOrderById);

// UPDATE order status
router.patch("/:id/status", orderController.updateOrderStatus);

// UPDATE payment status
router.patch("/:id/payment", orderController.updatePaymentStatus);

// LIST orders for restaurant
router.get("/restaurant/:restaurantId", orderController.getOrdersForRestaurant);

// LIST orders for customer
router.get("/customer/:customerId", orderController.getOrdersForCustomer);

export default router;
