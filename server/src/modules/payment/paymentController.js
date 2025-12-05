// // src/modules/payment/paymentController.js
// import PaymentService from "./paymentService.js";

// class PaymentController {
//   async createCheckoutSession(req, res) {
//     try {
//       const { orderId } = req.body;
      
//       if (!orderId) {
//         return res.status(400).json({ error: "orderId is required" });
//       }

//       const session = await PaymentService.createCheckoutSession(orderId, {
//         traceId: req.requestId
//       });

//       res.json({
//         url: session.url,
//         sessionId: session.id,
//         orderId: orderId
//       });

//     } catch (error) {
//       console.error("Checkout session error:", error);
//       res.status(500).json({ 
//         error: error.message || "Failed to create checkout session" 
//       });
//     }
//   }

//   async handleWebhook(req, res) {
//     try {
//       const result = await PaymentService.handleWebhook(req);
//       res.status(result.statusCode).json(result.body);
//     } catch (error) {
//       console.error("Webhook processing error:", error);
//       res.status(500).json({ error: error.message });
//     }
//   }
// }

// export default new PaymentController();

// src/modules/payment/paymentController.js
import PaymentService from "./paymentService.js";
import OrderRepository from "../order.module/order.repository.js";

class PaymentController {
  async createCheckoutSession(req, res) {
    try {
      const { orderId } = req.body;
      
      console.log("=== CHECKOUT SESSION DEBUG ===");
      console.log("Order ID from request:", orderId);
      console.log("User from middleware:", req.user);
      console.log("Is guest?", req.user?.isGuest);
      console.log("User ID:", req.user?._id);
      
      if (!orderId) {
        return res.status(400).json({ 
          success: false,
          error: "orderId is required" 
        });
      }

      // Pass user info to service
      const session = await PaymentService.createCheckoutSession(orderId, {
        traceId: req.requestId,
        user: req.user, // Pass user object to service
        isGuest: req.user?.isGuest || false
      });

      res.json({
        success: true,
        url: session.url,
        sessionId: session.id,
        orderId: orderId,
        isGuest: req.user?.isGuest || false
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
      const result = await PaymentService.handleWebhook(req);
      res.status(result.statusCode).json(result.body);
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // GET order by Stripe session id
  async getOrderBySession(req, res) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) return res.status(400).json({ success: false, message: "sessionId is required" });
      const order = await OrderRepository.findByStripeSessionId(sessionId);
      if (!order) return res.status(404).json({ success: false, message: "Order not found for session" });
      return res.json({ success: true, data: order });
    } catch (err) {
      console.error("Get order by session error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default new PaymentController();