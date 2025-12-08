// paymentRoutes.js
import express from "express";
import PaymentController from "./paymentController.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";
import Order from "../order.module/orderModel.js";

const router = express.Router();

// Create checkout session
router.post("/create", optionalAuthMiddleware, PaymentController.createCheckoutSession);

// Stripe webhook (needs raw body)
router.post("/webhook", 
  express.raw({ type: 'application/json' }), // CRITICAL: raw body for Stripe signature
  PaymentController.handleWebhook
);

// Get order by Stripe session ID
router.get("/session/:sessionId/order", optionalAuthMiddleware, PaymentController.getOrderBySession);

// Pay in store (cashier)
router.post("/:id/pay-instore", optionalAuthMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Update order for in-store payment: mark as paid but do NOT change overall order status.
    // Cashier should confirm the order status explicitly via the status endpoint.
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentMethod: "cash",
        paymentStatus: "paid",
        paidAt: new Date()
      },
      { new: true }
    ).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Emit socket events: notify cashier with generic event, and notify the specific customer
    // with a 'your-' prefixed event so the client SocketProvider handlers pick it up.
    if (global.io) {
      // Cashier gets generic payment-updated
      global.io.to("cashier").emit("order:payment-updated", order);

      // Also emit the generic event globally for other listeners
      global.io.emit("order:payment-updated", order);

      // Customer-specific: emit a 'your' prefixed event to their personal room
      if (order.customerId) {
        global.io.to(`user:${order.customerId}`).emit("order:your-payment-updated", order);
        // Keep backward compatibility with clients listening to plain 'order:payment-updated'
        global.io.to(`user:${order.customerId}`).emit("order:payment-updated", order);
      }
    }

    res.json({ 
      success: true, 
      message: "Order marked as paid in-store",
      data: order
    });
    
  } catch (err) {
    console.error("Pay instore error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to process in-store payment" 
    });
  }
});

export default router;