// src/modules/payment/paymentController.js
import PaymentService from "./paymentService.js";

class PaymentController {
  async createCheckoutSession(req, res) {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "orderId is required" });
      }

      const session = await PaymentService.createCheckoutSession(orderId, {
        traceId: req.requestId
      });

      res.json({
        url: session.url,
        sessionId: session.id,
        orderId: orderId
      });

    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ 
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
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PaymentController();