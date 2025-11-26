import stripe from "stripe";
import mongoose from "mongoose";
import OrderRepository from "../order.module/order.repository.js";
// import RewardService from "../rewards/reward.service.js";

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {

  // ==========================
  // Create Checkout Session
  // ==========================
  async createCheckoutSession(orderId) {
    const order = await OrderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    // prepare line items for Stripe
    const line_items = order.items.map(item => ({
      price_data: {
        currency: "egp",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100) // convert to cents
      },
      quantity: item.quantity
    }));

    // create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: { orderId: order._id.toString() }
    });

    // save Stripe session ID in the order for future reference
    await OrderRepository.updatePayment(orderId, "unpaid", "card");
    await OrderRepository.updateStripeSessionId(orderId, session.id); // <-- new repository method

    return session;
  }

  // ==========================
  // Handle Checkout Webhook
  // ==========================
  async handleCheckoutSession(session) {
    const orderId = session.metadata.orderId;
    const sessionId = session.id;

    const order = await OrderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    // example: 1 reward point per 1 EGP
    const rewardPoints = order.totalAmount;

    const sessionM = await mongoose.startSession();
    sessionM.startTransaction();

    try {
      // update payment status to "paid" and attach Stripe session ID
      await OrderRepository.updatePayment(orderId, "paid", "card");
      await OrderRepository.updateStripeSessionId(orderId, sessionId);

      // update reward points in the order
      await OrderRepository.updateRewardPoints(orderId, rewardPoints);

      // if user is logged in, add points to their account
      if (order.customerId) {
        await RewardService.addPoints(order.customerId, rewardPoints, { session: sessionM });
      }

      await sessionM.commitTransaction();
      sessionM.endSession();
    } catch (err) {
      await sessionM.abortTransaction();
      sessionM.endSession();
      throw err;
    }
  }
}

export default new PaymentService();
