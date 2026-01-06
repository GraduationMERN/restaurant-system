import express from "express";
import * as orderController from "./order.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import requestIdMiddleware from "../../middlewares/requestId.middleware.js";
import Order from "./orderModel.js";

const router = express.Router();
// ============= PUBLIC/GUEST ROUTES =============

// Ensure guest ID is generated and cookie is set
router.get("/guest-id", optionalAuthMiddleware, orderController.getGuestId);

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
router.get("/all-orders-rewards", authMiddleware, roleMiddleware("cashier", "admin", "kitchen"), orderController.getAllOrdersAndRewardOrders);
// ---- STATS ----
router.get("/stats/overview", optionalAuthMiddleware, orderController.getOverviewStats);
router.get("/stats/daily", optionalAuthMiddleware, orderController.getDailyStats);
router.get("/stats/top-items", optionalAuthMiddleware, orderController.getTopItems);
router.get("/stats/peak-hours", optionalAuthMiddleware, orderController.getPeakHours);
router.get("/stats/revenue-by-day", optionalAuthMiddleware, orderController.getRevenueByDayOfWeek);
router.get("/stats/monthly", optionalAuthMiddleware, orderController.getMonthlyRevenue);
router.post("/reorder/:orderId", authMiddleware, orderController.reorderOrderController);




// ============= CASHIER ROUTES =============
router.get("/kitchen/active", authMiddleware, roleMiddleware("cashier", "admin", "kitchen"), orderController.getActiveOrders);

router.patch("/:id/cancel", optionalAuthMiddleware, orderController.cancelOrder);
router.patch("/:id/update", authMiddleware, orderController.updateOwnOrder);

// ---- ADMIN/CASHIER ----
router.patch("/:id/status", authMiddleware, roleMiddleware("cashier", "admin", "kitchen"), orderController.updateOrderStatus);
router.patch("/:id/payment", authMiddleware, roleMiddleware("cashier", "admin"), orderController.updatePaymentStatus);

// Update payment method (customer selects payment during checkout)
router.patch("/:id/payment-method", optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    if (!["cash", "card", "instore", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.paymentMethod = paymentMethod;
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('createdBy', 'name')
      .lean();

    res.json({
      success: true,
      data: populatedOrder,
      message: `Payment method updated to ${paymentMethod}`
    });
  } catch (err) {
    console.error("Update payment method error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============= ADMIN ROUTES =============
router.get("/user/:userId", authMiddleware, orderController.getUserOrders);

router.get("/session/:sessionId", optionalAuthMiddleware, orderController.getOrderByStripeSession);
// ---- CUSTOMER ---- 

router.get("/:id", optionalAuthMiddleware, orderController.getOrder);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "cashier"), orderController.deleteOrder);

export default router;