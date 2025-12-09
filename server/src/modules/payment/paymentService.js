// src/modules/payment/paymentService.js
import stripe from "stripe";
import mongoose from "mongoose";
import OrderRepository from "../order.module/order.repository.js";
import logger from "../../utils/logger.js";

// Don't import notificationService and io directly - they'll be passed or accessed via server
// Remove: import { notificationService, io } from "../../../server.js";

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  // Create Stripe Checkout Session (UPDATED)
  async createCheckoutSession(orderId, meta = {}) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    // Fetch order with user population
    const order = await OrderRepository.findById(orderId, true); // true for populate
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "paid") {
      throw new Error("Order already paid");
    }

    // Validate order has items
    if (!order.items || order.items.length === 0) {
      throw new Error("Order has no items");
    }

    // Prepare line items - FIXED: Use proper price calculation
    const line_items = order.items.map(item => {
      const description = this._formatItemOptions(item.selectedOptions);
      const priceData = {
        currency: process.env.STRIPE_CURRENCY || "usd",
        product_data: { 
          name: item.name
        },
        unit_amount: Math.round((item.price || item.totalPrice / item.quantity) * 100)
      };
      
      // Only add description if it's not empty
      if (description) {
        priceData.product_data.description = description;
      }
      
      return {
        price_data: priceData,
        quantity: item.quantity || 1
      };
    });

    // Add delivery fee as line item if applicable
    if (order.deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: process.env.STRIPE_CURRENCY || "usd",
          product_data: { name: "Delivery Fee" },
          unit_amount: Math.round(order.deliveryFee * 100)
        },
        quantity: 1
      });
    }

    // Customer metadata for Stripe
    const customerEmail = order.customerInfo?.email || 
                         (order.user?.email) || 
                         meta.user?.email;

    // Session metadata
    const metadata = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      customerId: order.customerId || "guest",
      customerType: order.customerType || "guest",
      source: "restaurant-saas"
    };

    if (meta.traceId) metadata.traceId = meta.traceId;

    // Create Stripe session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel?order_id=${order._id}`,
      metadata,
      customer_email: customerEmail || undefined,
      shipping_address_collection: order.serviceType === "delivery" ? {
        allowed_countries: ["US", "GB", "CA", "AU", "EG"] // Adjust as needed
      } : undefined,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    // Update order with Stripe session ID
    await OrderRepository.updatePayment(orderId, {
      stripeSessionId: session.id,
      paymentStatus: "pending",
      paymentMethod: "card"
    });

    logger.info("Created Stripe session", {
      orderId,
      sessionId: session.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount
    });

    return session;
  }

  // Handle Stripe Webhook (COMPLETE FIX)
  async handleWebhook(req, { io, notificationService } = {}) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return { statusCode: 400, body: "Missing signature" };
    }

    let event;
    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.warn("Stripe signature verification failed", { message: err.message });
      return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    logger.info("Stripe webhook received", {
      type: event.type,
      id: event.id
    });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await this._onCheckoutSessionCompleted(event.data.object, { io, notificationService });
        break;
        
      case "checkout.session.expired":
        await this._onCheckoutSessionExpired(event.data.object, { io, notificationService });
        break;
        
      case "payment_intent.succeeded":
        // Already handled by checkout.session.completed
        break;
        
      case "payment_intent.payment_failed":
        await this._onPaymentFailed(event.data.object, { io, notificationService });
        break;
        
      case "charge.refunded":
        await this._onChargeRefunded(event.data.object, { io, notificationService });
        break;
        
      default:
        logger.debug("Unhandled stripe event type", { type: event.type });
    }

    return { statusCode: 200, body: { received: true } };
  }

  // Process successful checkout session
  async _onCheckoutSessionCompleted(sessionObject, { io, notificationService } = {}) {
    const orderId = sessionObject.metadata?.orderId;
    const sessionId = sessionObject.id;

    if (!orderId) {
      logger.error("Webhook session missing orderId metadata", { sessionId });
      throw new Error("Missing orderId in session metadata");
    }

    logger.info("Processing checkout.session.completed", {
      orderId,
      sessionId,
      paymentIntent: sessionObject.payment_intent
    });

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // 1. Find order
      const order = await OrderRepository.findById(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // 2. Check if already processed
      if (order.paymentStatus === "paid") {
        logger.info("Order already paid - skipping", { orderId });
        await mongoSession.commitTransaction();
        mongoSession.endSession();
        return;
      }

      // 3. Update order with payment details
      const updatedOrder = await OrderRepository.updatePayment(
        orderId,
        {
          paymentStatus: "paid",
          paymentMethod: "card",
          paidAt: new Date(),
          stripeSessionId: sessionId,
          stripePaymentIntent: sessionObject.payment_intent || null,
          status: "confirmed", // Auto-confirm on successful payment
          updatedAt: new Date()
        },
        { session: mongoSession }
      );

      // 4. 🔥 CRITICAL FIX: Save to user order history if registered user
      if (updatedOrder.user) {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(
          updatedOrder.user,
          {
            $push: {
              orderHistory: {
                orderId: updatedOrder._id,
                orderNumber: updatedOrder.orderNumber,
                totalAmount: updatedOrder.totalAmount,
                status: updatedOrder.status,
                paidAt: new Date(),
                itemsCount: updatedOrder.items.length
              }
            }
          },
          { session: mongoSession }
        );
        logger.info("Saved order to user history", {
          userId: updatedOrder.user,
          orderId: updatedOrder._id
        });
      }

      // 5. Delete cart if exists (optional)
      if (updatedOrder.cartId) {
        const Cart = mongoose.model('Cart');
        await Cart.findByIdAndDelete(updatedOrder.cartId, { session: mongoSession });
      }

      // 6. Commit transaction
      await mongoSession.commitTransaction();
      mongoSession.endSession();

      logger.info("Successfully processed payment", {
        orderId,
        orderNumber: updatedOrder.orderNumber,
        amount: updatedOrder.totalAmount
      });

      // 7. Emit events and notifications (after transaction is committed)
      await this._emitPaymentSuccessEvents(updatedOrder, { io, notificationService });

    } catch (error) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      logger.error("Failed to process checkout session", {
        orderId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Process expired session
  async _onCheckoutSessionExpired(sessionObject, { io, notificationService } = {}) {
    const orderId = sessionObject.metadata?.orderId;
    if (!orderId) return;

    try {
      const order = await OrderRepository.findById(orderId);
      if (!order) return;

      // Only update if still pending
      if (order.paymentStatus === "pending" && order.stripeSessionId === sessionObject.id) {
        const updatedOrder = await OrderRepository.updatePayment(orderId, {
          paymentStatus: "failed",
          updatedAt: new Date()
        });

        logger.info("Marked order as failed due to expired session", { orderId });

        // 🔥 Broadcast payment failure to all parties
        if (io) {
          io.to("cashier").emit("order:payment-updated", updatedOrder);
          if (updatedOrder.customerId) {
            io.to(`user:${updatedOrder.customerId}`).emit("order:your-payment-updated", {
              orderId: updatedOrder._id,
              _id: updatedOrder._id,
              paymentStatus: "failed",
              message: "Payment session expired"
            });
          }
          io.to("kitchen").emit("order:payment-updated", updatedOrder);
        }
      }
    } catch (error) {
      logger.error("Failed to process expired session", { orderId, error: error.message });
    }
  }

  // Process failed payment
  async _onPaymentFailed(paymentIntent, { io, notificationService } = {}) {
    const metadata = paymentIntent.metadata;
    const orderId = metadata?.orderId;

    if (orderId) {
      try {
        const updatedOrder = await OrderRepository.updatePayment(orderId, {
          paymentStatus: "failed",
          updatedAt: new Date()
        });
        logger.info("Marked order as failed", { orderId });

        // 🔥 Broadcast payment failure
        if (io) {
          io.to("cashier").emit("order:payment-updated", updatedOrder);
          if (updatedOrder.customerId) {
            io.to(`user:${updatedOrder.customerId}`).emit("order:your-payment-updated", {
              orderId: updatedOrder._id,
              _id: updatedOrder._id,
              paymentStatus: "failed",
              message: "Payment failed"
            });
          }
          io.to("kitchen").emit("order:payment-updated", updatedOrder);
        }
      } catch (error) {
        logger.error("Failed to update order payment status", { orderId, error: error.message });
      }
    }
  }

  // Process refund
  async _onChargeRefunded(charge, { io, notificationService } = {}) {
    const paymentIntent = charge.payment_intent;
    
    // Find order by payment intent
    const order = await OrderRepository.findByStripePaymentIntent(paymentIntent);
    if (order) {
      const updatedOrder = await OrderRepository.updatePayment(order._id, {
        paymentStatus: "refunded",
        refundAmount: charge.amount_refunded / 100,
        refundedAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info("Updated order as refunded", { orderId: order._id });

      // 🔥 Broadcast refund status to all interested parties
      if (io) {
        // Notify cashier
        io.to("cashier").emit("order:payment-updated", updatedOrder);
        
        // Notify customer
        if (updatedOrder.customerId) {
          io.to(`user:${updatedOrder.customerId}`).emit("order:your-payment-updated", {
            orderId: updatedOrder._id,
            _id: updatedOrder._id,
            paymentStatus: "refunded",
            refundAmount: charge.amount_refunded / 100,
            refundedAt: new Date()
          });
        }
        
        // Notify kitchen
        io.to("kitchen").emit("order:payment-updated", updatedOrder);
      }

      // Send notification
      if (notificationService && updatedOrder.customerInfo?.email) {
        await notificationService.sendEmail({
          to: updatedOrder.customerInfo.email,
          subject: `Refund Processed - Order ${updatedOrder.orderNumber}`,
          template: 'refund-confirmed',
          data: {
            orderNumber: updatedOrder.orderNumber,
            refundAmount: charge.amount_refunded / 100
          }
        });
      }
    }
  }

  // Emit payment success events
  async _emitPaymentSuccessEvents(order, { io, notificationService } = {}) {
    try {
      // 1. Notifications
      if (notificationService) {
        // Notify customer if they have email
        if (order.customerInfo?.email) {
          await notificationService.sendEmail({
            to: order.customerInfo.email,
            subject: `Payment Confirmed - Order ${order.orderNumber}`,
            template: 'payment-confirmed',
            data: {
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              estimatedReadyTime: order.estimatedReadyTime
            }
          });
        }

        // Notify cashier staff
        await notificationService.sendToRole("cashier", {
          title: "💰 New Paid Order",
          message: `Order ${order.orderNumber} has been paid online (${order.serviceType})`,
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          priority: "high"
        });

        // Notify kitchen for preparation
        if (["dine-in", "pickup", "delivery"].includes(order.serviceType)) {
          await notificationService.sendToRole("kitchen", {
            title: "👨‍🍳 New Online Order",
            message: `Order ${order.orderNumber} ready for preparation`,
            orderId: order._id,
            orderNumber: order.orderNumber,
            itemsCount: order.items.length,
            priority: "medium"
          });
        }
      }

      // 2. Socket.io events
      if (io) {
        // General broadcast
        io.emit("order:payment:success", {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          customerName: order.customerInfo?.name || "Guest",
          totalAmount: order.totalAmount,
          timestamp: new Date()
        });

        // Room-specific events
        io.to("cashier").emit("order:new:paid", order);
        io.to("kitchen").emit("order:new:online", order);

        // Customer-specific room
        if (order.customerId) {
          io.to(`user:${order.customerId}`).emit("order:payment:confirmed", {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            message: "Payment confirmed! Your order is being prepared."
          });
        }
      }

    } catch (error) {
      logger.error("Failed to emit payment success events", {
        orderId: order._id,
        error: error.message
      });
    }
  }

  // Refund payment
  async refundPayment(orderId, refundAmount = 0, { io, notificationService } = {}) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured for refunds");
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.stripePaymentIntent) {
      throw new Error("No Stripe payment intent associated with this order");
    }

    if (order.paymentStatus !== "paid") {
      throw new Error(`Cannot refund order with status: ${order.paymentStatus}`);
    }

    // Calculate refund amount (full or partial)
    const amount = refundAmount > 0 
      ? Math.round(refundAmount * 100)
      : Math.round(order.totalAmount * 100);

    try {
      const refund = await stripeClient.refunds.create({
        payment_intent: order.stripePaymentIntent,
        amount: amount,
        reason: "requested_by_customer"
      });

      // Update order
      const updates = {
        paymentStatus: "refunded",
        refundAmount: amount / 100,
        refundedAt: new Date(),
        updatedAt: new Date()
      };

      const updatedOrder = await OrderRepository.updatePayment(orderId, updates);

      // Emit events
      if (io || notificationService) {
        await this._emitRefundEvents(updatedOrder, { io, notificationService });
      }

      logger.info("Refund processed successfully", {
        orderId,
        refundId: refund.id,
        amount: amount / 100
      });

      return { refund, order: updatedOrder };

    } catch (error) {
      logger.error("Stripe refund failed", {
        orderId,
        error: error.message,
        stripeError: error.raw?.message
      });
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  // Emit refund events
  async _emitRefundEvents(order, { io, notificationService } = {}) {
    try {
      if (notificationService) {
        // Notify admin
        await notificationService.sendToAdmin({
          title: "🔄 Order Refunded",
          message: `Order ${order.orderNumber} was refunded (${order.refundAmount})`,
          orderId: order._id,
          priority: "high"
        });

        // Notify customer if they have email
        if (order.customerInfo?.email) {
          await notificationService.sendEmail({
            to: order.customerInfo.email,
            subject: `Refund Processed - Order ${order.orderNumber}`,
            template: 'refund-processed',
            data: {
              orderNumber: order.orderNumber,
              refundAmount: order.refundAmount,
              orderId: order._id
            }
          });
        }
      }

      if (io) {
        io.emit("order:refunded", {
          orderId: order._id,
          orderNumber: order.orderNumber,
          refundAmount: order.refundAmount,
          timestamp: new Date()
        });

        if (order.customerId) {
          io.to(`user:${order.customerId}`).emit("order:refund:processed", {
            orderId: order._id,
            refundAmount: order.refundAmount
          });
        }
      }
    } catch (error) {
      logger.error("Failed to emit refund events", { error: error.message });
    }
  }

  // Helper: Format item options for Stripe
  _formatItemOptions(selectedOptions) {
    if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
      return "";
    }
    return Object.entries(selectedOptions)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  // Get order by Stripe session ID
  async getOrderBySessionId(sessionId) {
    return await OrderRepository.findByStripeSessionId(sessionId, true);
  }

  // Verify payment status
  async verifyPaymentStatus(orderId) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.stripeSessionId) {
      return { status: order.paymentStatus, verified: false };
    }

    try {
      const session = await stripeClient.checkout.sessions.retrieve(order.stripeSessionId);
      return {
        status: session.payment_status,
        stripeStatus: session.payment_status,
        orderStatus: order.paymentStatus,
        verified: true,
        session
      };
    } catch (error) {
      logger.error("Failed to verify payment status", { orderId, error: error.message });
      return { status: order.paymentStatus, verified: false, error: error.message };
    }
  }
}

export default new PaymentService();