// paymentController.js - Updated for your server structure
import PaymentService from "./paymentService.js";
import Order from "../order.module/orderModel.js";

class PaymentController {
  async createCheckoutSession(req, res) {
    try {
      const { orderId } = req.body;
      const user = req.user;

      console.log("=== CHECKOUT SESSION REQUEST ===");
      console.log("Order ID:", orderId);
      console.log("User:", user?._id || "guest");
      console.log("Is guest:", user?.isGuest || false);

      if (!orderId) {
        return res.status(400).json({ 
          success: false,
          error: "orderId is required" 
        });
      }

      // Verify order exists
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found"
        });
      }

      // Verify ownership - handle both registered users and guests
      const isRegisteredUser = user?._id && !user?.isGuest;
      const userIdentifier = isRegisteredUser ? user._id.toString() : null;
      
      // Allow payment if:
      // 1. Registered user matches order.customerId
      // 2. OR guest user (always allow - guest orders have guest_* customerId)
      // 3. OR admin/cashier roles
      const isAuthorized = 
        (isRegisteredUser && order.customerId === userIdentifier) ||
        user?.isGuest ||
        ["admin", "cashier", "kitchen"].includes(user?.role);
      
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to pay for this order"
        });
      }

      // Create session with user metadata - use customerId for tracking
      const session = await PaymentService.createCheckoutSession(orderId, {
        user: {
          id: order.customerId, // Use order's customerId which handles both registered and guest
          email: order.customerInfo?.email || user?.email,
          name: order.customerInfo?.name || user?.name,
          isGuest: user?.isGuest || false
        },
        traceId: req.requestId // from your requestIdMiddleware
      });

      res.json({
        success: true,
        url: session.url,
        sessionId: session.id,
        orderId: orderId,
        orderNumber: order.orderNumber
      });

    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to create checkout session" 
      });
    }
  }

  async handleWebhook(req, res) {
    try {
      // Use the global io and notificationService from your server.js
      const result = await PaymentService.handleWebhook(req, {
        io: global.io,
        notificationService: global.notificationService
      });
      
      res.status(result.statusCode).json(result.body);
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getOrderBySession(req, res) {
    try {
      const { sessionId } = req.params;
      const user = req.user;

      if (!sessionId) {
        return res.status(400).json({ 
          success: false, 
          message: "sessionId is required" 
        });
      }

      const order = await Order.findOne({ stripeSessionId: sessionId })
        .populate('user', 'name email phone')
        .lean();

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found for this session" 
        });
      }

      // Check permissions
      const userIdentifier = user?._id || user?.customerId;
      const canView = 
        order.customerId === userIdentifier ||
        ["admin", "cashier"].includes(user?.role);

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this order"
        });
      }

      return res.json({ 
        success: true, 
        data: order 
      });
    } catch (err) {
      console.error("Get order by session error:", err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  }
}

export default new PaymentController();