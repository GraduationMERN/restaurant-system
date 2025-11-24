import PaymentService from "./paymentService.js";
import stripe from "stripe";
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  async createCheckoutSession(req, res) {
    try {
      const { orderId } = req.body;
      const session = await PaymentService.createCheckoutSession(orderId);
      res.json({ url: session.url }); // frontend ي redirect للرابط
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

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
      } catch (err) {
        console.error("Checkout session handling error:", err.message);
      }
    }

    res.json({ received: true });
  }
}

export default new PaymentController();
