import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import requestIdMiddleware from "../../middlewares/requestId.middleware.js";
// import optionalAuthMiddleware from './../../middlewares/optionalAuthMiddleware';

const router = express.Router();

// Global: attach requestId + optional auth for allowed routes
router.use(requestIdMiddleware); 
// ---- CREATE ----
router.post("/from-cart", optionalAuthMiddleware, orderController.createOrderFromCart);
router.post("/direct", optionalAuthMiddleware, orderController.createDirectOrder);

// ---- GET ----
router.get("/:id", optionalAuthMiddleware, orderController.getOrder);
router.get("/user/:userId", optionalAuthMiddleware, orderController.getUserOrders);
router.get("/cart/:cartId", optionalAuthMiddleware, orderController.getOrderByCartId);
router.get("/kitchen/active", authMiddleware, roleMiddleware("cashier", "admin"), orderController.getActiveOrders);
router.get("/", authMiddleware, roleMiddleware("cashier", "admin"), orderController.getAllOrders);

// ---- CUSTOMER ---- 
router.patch("/:id/cancel", optionalAuthMiddleware, orderController.cancelOrder);
router.patch("/:id/update", authMiddleware, orderController.updateOwnOrder);

// ---- ADMIN/CASHIER ----
router.patch("/:id/status", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updateOrderStatus);
router.patch("/:id/payment", optionalAuthMiddleware, orderController.updatePaymentStatus);
router.patch("/:id/customer-info", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updateCustomerInfo);
router.patch("/:id/link-user", authMiddleware, roleMiddleware("cashier", "admin"), orderController.linkUserToOrder);


// ---- MANAGEMENT ----
router.post("/search", authMiddleware, roleMiddleware("cashier", "admin"), orderController.searchOrders);
router.delete("/:id", authMiddleware, roleMiddleware("cashier", "admin"), orderController.deleteOrder);

// Development-only route to simulate cashier/kitchen status updates without auth
if (process.env.NODE_ENV !== 'production') {
	router.post("/dev/:id/status", orderController.updateOrderStatusDev);
}

export default router;
