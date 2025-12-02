// src/modules/payment/paymentService.js
import stripe from "stripe";
import mongoose from "mongoose";
import OrderRepository from "../order.module/order.repository.js";
import logger from "../../utils/logger.js";

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  // Create Stripe Checkout Session
  async createCheckoutSession(orderId, meta = {}) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe secret key not configured");

    const order = await OrderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "paid") throw new Error("Order already paid");

    // Prepare line items
    const line_items = order.items.map(item => ({
      price_data: {
        currency: process.env.STRIPE_CURRENCY || "egp",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity || 1
    }));

    // Metadata
    const metadata = { orderId: order._id.toString(), source: "saas-table-management" };
    if (meta.traceId) metadata.traceId = meta.traceId;

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata,
    });

    // Update order: status pending and save Stripe session
    await OrderRepository.updatePayment(orderId, { 
      paymentStatus: "pending", 
      paymentMethod: "card",
      stripeSessionId: session.id 
    });

    logger.info("Created Stripe session", { orderId, sessionId: session.id });
    return session;
  }

  // Handle Stripe Webhook
  async handleWebhook(req) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET");

    const sig = req.headers["stripe-signature"];
    if (!sig) return { statusCode: 400, body: "Missing signature" };

    let event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn("Stripe signature verification failed", { message: err.message });
      return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    logger.info("Stripe webhook received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed":
        await this._onCheckoutSessionCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        logger.info("checkout.session.expired", { id: event.id });
        break;
      default:
        logger.debug("Unhandled stripe event type", { type: event.type });
    }

    return { statusCode: 200, body: { received: true } };
  }

  // Internal: process checkout session completion
  // async _onCheckoutSessionCompleted(sessionObject) {
  //   const orderId = sessionObject.metadata?.orderId;
  //   const sessionId = sessionObject.id;

  //   if (!orderId) {
  //     logger.error("Webhook session missing orderId metadata", { sessionId });
  //     throw new Error("Missing orderId in session metadata");
  //   }

  //   const order = await OrderRepository.findById(orderId);
  //   if (!order) throw new Error("Order not found");

  //   if (order.paymentStatus === "paid") {
  //     logger.info("Order already paid - skipping", { orderId });
  //     return;
  //   }

  //   const mongoSession = await mongoose.startSession();
  //   mongoSession.startTransaction();

  //   try {
  //     await OrderRepository.updatePayment(orderId, { 
  //       paymentStatus: "paid", 
  //       paymentMethod: "card", 
  //       paidAt: new Date(),
  //       stripeSessionId: sessionId
  //     }, { session: mongoSession });

  //     await mongoSession.commitTransaction();
  //     mongoSession.endSession();

  //     logger.info("Processed checkout.session.completed", { orderId, sessionId });
  //   } catch (err) {
  //     await mongoSession.abortTransaction();
  //     mongoSession.endSession();
  //     logger.error("Failed to process checkout.session.completed", { orderId, message: err.message });
  //     throw err;
  //   }
  // }
  // In paymentService.js - update _onCheckoutSessionCompleted
async _onCheckoutSessionCompleted(sessionObject) {
  const orderId = sessionObject.metadata?.orderId;
  const sessionId = sessionObject.id;

  if (!orderId) {
    logger.error("Webhook session missing orderId metadata", { sessionId });
    throw new Error("Missing orderId in session metadata");
  }

  const order = await OrderRepository.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.paymentStatus === "paid") {
    logger.info("Order already paid - skipping", { orderId });
    return;
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    await OrderRepository.updatePayment(orderId, { 
      paymentStatus: "paid", 
      paymentMethod: "card", // Explicitly set payment method
      paidAt: new Date(),
      stripeSessionId: sessionId
    }, { session: mongoSession });

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    logger.info("Processed checkout.session.completed", { orderId, sessionId });
  } catch (err) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    logger.error("Failed to process checkout.session.completed", { orderId, message: err.message });
    throw err;
  }
}
}


export default new PaymentService();