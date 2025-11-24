import stripe from "stripe";
import mongoose from "mongoose";
import OrderRepository from "../order.module/order.repository.js";
import RewardService from "../rewards/reward.service.js";
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  // 1) Create Checkout Session
  async createCheckoutSession(orderId) {
    const order = await OrderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Build line items for Stripe
    const line_items = order.items.map(item => ({
      price_data: {
        currency: "egp",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: { orderId: order._id.toString() }
    });

    // Save session id in order
    await OrderRepository.updatePayment(orderId, "unpaid", null, session.id);

    return session;
  }

  // 2) Handle webhook after successful payment
  async handleCheckoutSession(session) {
    const orderId = session.metadata.orderId;
    const sessionId = session.id;

    const order = await OrderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    const rewardPoints = order.totalAmount; // example: 1 point per currency unit

    const sessionM = await mongoose.startSession();
    sessionM.startTransaction();

    try {
      // Update order paymentStatus to paid
      await OrderRepository.updatePayment(orderId, "paid", "card", sessionId);
      await OrderRepository.updateRewardPoints(orderId, rewardPoints);

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