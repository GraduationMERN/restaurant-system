import PaymentService from "./paymentService.js";
import stripe from "stripe";

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  //  Create Checkout Session
  async createCheckoutSession(req, res) {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ success: false, message: "orderId is required" });
      }

      const session = await PaymentService.createCheckoutSession(orderId);

      res.status(200).json({ success: true, url: session.url });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ==========================
  // 2️⃣ Handle Stripe Webhook
  // ==========================
  async handleWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
  
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      try {
        await PaymentService.handleCheckoutSession(session);
        console.log(`Order ${session.metadata.orderId} marked as paid.`);
      } catch (err) {
        console.error("Error handling checkout session:", err.message);
      }
    }

    res.status(200).json({ received: true });
  }
}

export default new PaymentController();
