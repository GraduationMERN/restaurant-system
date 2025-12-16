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
      console.log("STRIPE_SECRET_KEY configured:", !!process.env.STRIPE_SECRET_KEY);
      console.log("CLIENT_URL:", process.env.CLIENT_URL);

      if (!orderId) {
        return res.status(400).json({ 
          success: false,
          error: "orderId is required" 
        });
      }

      // Verify order exists
      const order = await Order.findById(orderId);
      if (!order) {
        console.error("Order not found:", orderId);
        return res.status(404).json({
          success: false,
          error: "Order not found"
        });
      }

      console.log("Order found:", { 
        _id: order._id, 
        orderNumber: order.orderNumber, 
        items: order.items?.length || 0,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus
      });

      // Verify ownership - handle both registered users and guests
      const isRegisteredUser = user?._id && !user?.isGuest;
      const userIdentifier = isRegisteredUser ? user._id.toString() : null;
      
      // For guests, check if they have the matching guestOrderId cookie
      let isGuestOwner = false;
      if (!user?._id && user?.isGuest) {
        const guestId = req.cookies.guestOrderId;
        isGuestOwner = guestId && order.customerId?.toString() === guestId;
      }
      
      // Allow payment if:
      // 1. Registered user matches order.customerId
      // 2. OR guest user with matching guestOrderId cookie
      // 3. OR admin/cashier roles
      const isAuthorized = 
        (isRegisteredUser && order.customerId === userIdentifier) ||
        isGuestOwner ||
        ["admin", "cashier", "kitchen"].includes(user?.role);
      
      if (!isAuthorized) {
        console.log("[CHECKOUT] Authorization failed", {
          orderId,
          orderCustomerId: order.customerId,
          userIdentifier,
          guestId: req.cookies.guestOrderId,
          isGuestOwner,
          isRegisteredUser
        });
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
      console.error("Checkout session error:", {
        message: error.message,
        stack: error.stack,
        orderId: req.body?.orderId
      });
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to create checkout session",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

      // Check permissions - allow if:
      // 1. User is authenticated and matches the order's customerId
      // 2. OR User is a guest accessing their own order
      // 3. OR user is admin/cashier
      const userIdStr = user?._id?.toString();
      const isOwner = userIdStr && order.customerId?.toString() === userIdStr;
      const isStaff = ["admin", "cashier"].includes(user?.role);
      
      // For guest users, check if they have the matching guestOrderId cookie
      let isGuestOwner = false;
      if (!user?._id && user?.isGuest) {
        const guestId = req.cookies.guestOrderId;
        isGuestOwner = guestId && order.customerId?.toString() === guestId;
      }

      if (!(isOwner || isStaff || isGuestOwner)) {
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