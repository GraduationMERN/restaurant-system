import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import requestIdMiddleware from "../../middlewares/requestId.middleware.js";

const router = express.Router();
// ============= PUBLIC/GUEST ROUTES =============


router.post("/from-cart", optionalAuthMiddleware, orderController.createOrderFromCart);
router.post("/direct", optionalAuthMiddleware, orderController.createDirectOrder);

// ============= CUSTOMER ROUTES =============
router.get("/active", optionalAuthMiddleware, orderController.getActiveOrder);
router.get("/history", optionalAuthMiddleware, orderController.getOrderHistoryForUser);

// ============= PUBLIC/GUEST ROUTES (continued) =============


// Global: attach requestId + optional auth for allowed routes
router.use(requestIdMiddleware);

// ---- GET ----
router.get("/recent", optionalAuthMiddleware, orderController.getRecentOrdersList);

router.get("/", authMiddleware, roleMiddleware("cashier", "admin"), orderController.getAllOrders);
// ---- STATS ----
router.get("/stats/overview", optionalAuthMiddleware, orderController.getOverviewStats);
router.get("/stats/daily", optionalAuthMiddleware, orderController.getDailyStats);
router.get("/stats/top-items", optionalAuthMiddleware, orderController.getTopItems);



// ============= CASHIER ROUTES =============
router.get("/kitchen/active", authMiddleware, roleMiddleware("cashier", "admin", "kitchen"), orderController.getActiveOrders);

router.patch("/:id/cancel", authMiddleware, orderController.cancelOrder);
router.patch("/:id/update", authMiddleware, orderController.updateOwnOrder);

// ---- ADMIN/CASHIER ----
router.patch("/:id/status", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updateOrderStatus);
router.patch("/:id/payment", optionalAuthMiddleware, orderController.updatePaymentStatus);

// ============= ADMIN ROUTES =============
router.get("/user/:userId", authMiddleware, orderController.getUserOrders);

router.get("/session/:sessionId", optionalAuthMiddleware, orderController.getOrderByStripeSession);
// ---- CUSTOMER ---- 

router.get("/:id", optionalAuthMiddleware, orderController.getOrder);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "cashier"), orderController.deleteOrder);

export default router;