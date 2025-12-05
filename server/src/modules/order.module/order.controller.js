import orderService from "./order.service.js";
import PaymentService from "../payment/paymentService.js";
import { notificationService, io } from "../../../server.js";

// ==============================
// CREATE ORDER FROM CART
// ==============================
// export const createOrderFromCart = async (req, res) => {
//   try {
//     const { 
//       cartId, 
//       serviceType,
//       tableNumber,
//       notes,
//       paymentMethod,
//       customerInfo 
//     } = req.body;

//     if (!cartId) {
//       return res.status(400).json({
//         success: false,
//         message: "cartId is required"
//       });
//     }

//     const order = await orderService.createOrderFromCart({
//       cartId,
//       serviceType,
//       tableNumber,
//       notes,
//       paymentMethod,
//       customerInfo,
//     });

//     // Optional Notification
//     await notificationService?.sendToAdmin({
//       title: "New Order",
//       message: `A new order was created by ${order.customerInfo?.name || "Guest"}`,
//       orderId: order._id,
//     });

//     res.status(201).json({ success: true, data: order });
//   } catch (err) {
//     console.error("Create order from cart error:", err);
//     res.status(400).json({ success: false, message: err.message });
//   }
// };
export const createOrderFromCart = async (req, res) => {
  try {
    const { 
      cartId, 
      serviceType,
      tableNumber,
      notes,
      paymentMethod,
      customerInfo 
    } = req.body;
    const { deliveryLocation } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "cartId is required"
      });
    }

    const order = await orderService.createOrderFromCart({
      cartId,
      serviceType,
      tableNumber,
      notes,
      paymentMethod,
      customerInfo,
      deliveryLocation,
    });

    // Optional Notification
    await notificationService?.sendToAdmin({
      title: "New Order",
      message: `A new order was created by ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
      estimatedReadyTime: order.formattedEstimatedTime, // Add estimated time to notification
    });
    // Also notify cashiers specifically
    await notificationService?.sendToRole("cashier", {
      title: "New Order",
      message: `New pending order from ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
      estimatedReadyTime: order.formattedEstimatedTime,
    });

    // Emit order creation to rooms for real-time updates using explicit event names
    try {
      if (io) {
        io.to("cashier").emit("order:created", order);
        io.to("kitchen").emit("order:created", order);
        // Also emit a general update for backwards compatibility
        io.to("cashier").emit("order:update", order);
        io.to("kitchen").emit("order:update", order);
        if (order?.customerId) {
          io.to(order.customerId.toString()).emit("order:created", order);
          io.to(order.customerId.toString()).emit("order:update", order);
        }
      }
    } catch (e) {
      console.error("Failed to emit order creation events", e);
    }

    res.status(201).json({ 
      success: true, 
      data: {
        ...order.toObject(),
        formattedEstimatedTime: order.formattedEstimatedTime, // Include formatted time in response
        remainingMinutes: order.remainingMinutes, // Include remaining minutes
        timeStatus: order.getTimeStatus(), // Include user-friendly time status
      }
    });
  } catch (err) {
    console.error("Create order from cart error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// CREATE DIRECT ORDER (KIOSK)
// ==============================
export const createDirectOrder = async (req, res) => {
  try {
    // Validate request body
    const { items, serviceType, tableId, customerInfo } = req.body;
    if (!serviceType) {
      return res.status(400).json({ success: false, message: "serviceType is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items are required and must be a non-empty array" });
    }

    // Ensure each item has required fields
    for (const it of items) {
      if (!it.name) return res.status(400).json({ success: false, message: "items.name is required" });
      if (typeof it.totalPrice === "undefined") return res.status(400).json({ success: false, message: "items.totalPrice is required" });
      if (typeof it.price === "undefined") return res.status(400).json({ success: false, message: "items.price is required" });
      if (typeof it.quantity === "undefined") it.quantity = 1;
    }

    // Build payload for service (allow cashier to pass tableId and customerInfo)
    const payload = {
      items,
      serviceType,
      tableNumber: tableId || null,
      customerInfo: customerInfo || {},
      paymentMethod: req.body.paymentMethod || "instore",
    };

    const identity = { user: req.user || null };

    const order = await orderService.createDirectOrder(payload, identity);

    // Notify admin and cashier
    await notificationService?.sendToAdmin({
      title: "New Direct Order",
      message: `A new direct order was created by ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
    });
    await notificationService?.sendToRole("cashier", {
      title: "New Direct Order",
      message: `Direct order created by ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
    });

    // Emit socket events
    try {
      if (io) {
        io.to("cashier").emit("order:created", order);
        io.to("kitchen").emit("order:created", order);
        io.to("cashier").emit("order:updated", order);
        io.to("kitchen").emit("order:updated", order);
        if (order?.customerId) {
          io.to(order.customerId.toString()).emit("order:created", order);
          io.to(order.customerId.toString()).emit("order:updated", order);
        }
      }
    } catch (e) {
      console.error("Failed to emit direct order creation events", e);
    }

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error("Create direct order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ORDERS
// ==============================
export const getOrder = async (req, res) => {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(404).json({ success: false, message: err.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByUser(req.params.userId);
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getOrderByCartId = async (req, res) => {
  try {
    const order = await orderService.getOrderByCartId(req.params.cartId);
    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Get order by cart error:", err);
    res.status(404).json({ success: false, message: err.message });
  }
};

export const getActiveOrders = async (req, res) => {
  try {
    const orders = await orderService.getActiveOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Get active orders error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// ADMIN / CASHIER UPDATES
// ==============================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, estimatedTime } = req.body;

    let order = null;

    // If estimatedTime provided, apply it first
    if (typeof estimatedTime !== "undefined" && estimatedTime !== null) {
      order = await orderService.orderUpdate(req.params.id, { estimatedTime });
    }

    if (typeof status !== "undefined") {
      order = await orderService.updateStatus(req.params.id, status);
    }

    // Emit notifications and socket events
    try {
      // Notify customer via notification service
      if (order?.customerId) {
        await notificationService?.sendToUser(
          order.customerId,
          "Order Update",
          `Your order status is now ${order.status}${order.estimatedTime ? `. Estimated time: ${order.estimatedTime} minutes` : ""}`,
          "order",
          order._id
        );
      }

      // Emit role-specific socket events and a general update
      if (io) {
        // Emit status-specific events to customer, cashier and kitchen
        const status = order?.status;
        if (status === "confirmed") {
          io.to("cashier").emit("order:confirmed", order);
          io.to("kitchen").emit("order:confirmed", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:confirmed", order);
        } else if (status === "preparing") {
          io.to("kitchen").emit("order:preparing", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:updated", order);
        } else if (status === "ready") {
          io.to("kitchen").emit("order:ready", order);
          io.to("cashier").emit("order:ready", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:ready", order);
        } else if (status === "completed") {
          io.to("cashier").emit("order:completed", order);
          io.to("kitchen").emit("order:completed", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:completed", order);
        } else if (status === "cancelled") {
          io.to("cashier").emit("order:cancelled", order);
          io.to("kitchen").emit("order:cancelled", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:cancelled", order);
        }

        // Always emit a general update for compatibility
        if (order?.customerId) io.to(order.customerId.toString()).emit("order:updated", order);
        io.to("cashier").emit("order:updated", order);
        io.to("kitchen").emit("order:updated", order);

        // Emit status-updated event for cashier actions
        if (typeof status !== "undefined" && order?.customerId) {
          io.to("cashier").emit("order:status-updated", { 
            orderId: order._id, 
            status: order.status,
            userId: order.userId,
            customerId: order.customerId,
            order: order 
          });
        }

        // If estimatedTime changed, emit specialized event
        if (typeof estimatedTime !== "undefined") {
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:estimatedTime", { orderId: order._id, estimatedTime: order.estimatedTime });
          io.to("cashier").emit("order:estimatedTime", { orderId: order._id, estimatedTime: order.estimatedTime });
        }
      }
    } catch (e) {
      console.error("Failed to emit order update events", e);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Development helper: update status without auth/role checks
export const updateOrderStatusDev = async (req, res) => {
  try {
    const { status, estimatedTime } = req.body;
    let order = null;

    if (typeof estimatedTime !== "undefined" && estimatedTime !== null) {
      order = await orderService.orderUpdate(req.params.id, { estimatedTime });
    }

    if (typeof status !== "undefined") {
      order = await orderService.updateStatus(req.params.id, status);
    }

    // Emit same events as the protected endpoint
    try {
      if (order?.customerId) {
        await notificationService?.sendToUser(
          order.customerId,
          "Order Update",
          `Your order status is now ${order.status}${order.estimatedTime ? `. Estimated time: ${order.estimatedTime} minutes` : ""}`,
          "order",
          order._id
        );
      }

      if (io) {
        const st = order?.status;
        if (st === "confirmed") {
          io.to("cashier").emit("order:confirmed", order);
          io.to("kitchen").emit("order:confirmed", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:confirmed", order);
        } else if (st === "preparing") {
          io.to("kitchen").emit("order:preparing", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:updated", order);
        } else if (st === "ready") {
          io.to("kitchen").emit("order:ready", order);
          io.to("cashier").emit("order:ready", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:ready", order);
        } else if (st === "completed") {
          io.to("cashier").emit("order:completed", order);
          io.to("kitchen").emit("order:completed", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:completed", order);
        } else if (st === "cancelled") {
          io.to("cashier").emit("order:cancelled", order);
          io.to("kitchen").emit("order:cancelled", order);
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:cancelled", order);
        }

        if (order?.customerId) io.to(order.customerId.toString()).emit("order:updated", order);
        io.to("cashier").emit("order:updated", order);
        io.to("kitchen").emit("order:updated", order);

        if (typeof estimatedTime !== "undefined") {
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:estimatedTime", { orderId: order._id, estimatedTime: order.estimatedTime });
          io.to("cashier").emit("order:estimatedTime", { orderId: order._id, estimatedTime: order.estimatedTime });
        }
      }
    } catch (e) {
      console.error("Failed to emit dev order update events", e);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Dev: Update order status error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, refundAmount } = req.body;

    // If refund requested and Stripe info exists, attempt Stripe refund via PaymentService
    let order = null;
    if (paymentStatus === "refunded") {
      try {
        const result = await PaymentService.refundPayment(req.params.id, refundAmount);
        order = result.updated || result;
      } catch (err) {
        console.error("Stripe refund failed:", err);
        // Fallback to storing refund metadata only
        order = await orderService.updatePaymentWithOptions(req.params.id, paymentStatus, paymentMethod, { refundAmount });
      }
    } else {
      // Use enhanced service method to persist refund metadata if provided
      order = await orderService.updatePaymentWithOptions(
        req.params.id,
        paymentStatus,
        paymentMethod,
        { refundAmount }
      );
    }

    // Notify customer and emit socket events
    try {
      if (order?.customerId) {
        await notificationService?.sendToUser(
          order.customerId,
          "Payment Update",
          `Payment status updated to ${order.paymentStatus}`,
          "order",
          order._id
        );
      }

      if (io) {
        // Emit general update
        if (order?.customerId) io.to(order.customerId.toString()).emit("order:updated", order);
        io.to("cashier").emit("order:updated", order);
        io.to("kitchen").emit("order:updated", order);

        // Emit payment-updated event for payment changes with user ID
        io.to("cashier").emit("order:payment-updated", { 
          orderId: order._id, 
          paymentStatus: order.paymentStatus,
          userId: order.userId,
          customerId: order.customerId,
          order: order 
        });

        // Emit refund-specific event
        if (paymentStatus === "refunded") {
          if (order?.customerId) io.to(order.customerId.toString()).emit("order:refunded", order);
          io.to("cashier").emit("order:refunded", order);
        }
      }
    } catch (e) {
      console.error("Failed to emit payment events or send notifications", e);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCustomerInfo = async (req, res) => {
  try {
    const { customerInfo } = req.body;
    const order = await orderService.updateCustomerInfo(req.params.id, customerInfo);
    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Update customer info error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const linkUserToOrder = async (req, res) => {
  try {
    const { userId } = req.body;
    const order = await orderService.linkUserToOrder(req.params.id, userId);
    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Link user to order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// SEARCH + DELETE
// ==============================
export const searchOrders = async (req, res) => {
  try {
    const { filter, options } = req.body;
    const orders = await orderService.searchOrders(filter, options);
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Search orders error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const result = await orderService.deleteOrder(req.params.id);
    // Emit deletion event
    try {
      if (io) {
        io.to("cashier").emit("order:deleted", { orderId: req.params.id });
        io.to("kitchen").emit("order:deleted", { orderId: req.params.id });
      }
      if (notificationService) {
        await notificationService.sendToAdmin({
          title: "Order Deleted",
          message: `Order ${req.params.id} was deleted by staff`,
          orderId: req.params.id,
        });
      }
    } catch (emitErr) {
      console.error("Failed to emit delete events", emitErr);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// CUSTOMER-ONLY
// ==============================
export const cancelOrder = async (req, res) => {
  try {
    // optionalAuthMiddleware sets req.user when logged in; otherwise we allow guest cancellation
    const identity = {};
    if (req.user && req.user._id) identity.userId = req.user._id;
    // allow client to provide guestId or phone in the body for verification
    if (req.body?.guestId) identity.guestId = req.body.guestId;
    if (req.body?.phone) identity.phone = req.body.phone;

    const order = await orderService.cancelOrderByIdentity(req.params.id, identity);

    // Emit cancel update & notify
    try {
      if (notificationService && order?.customerId) {
        await notificationService.sendToUser(
          order.customerId,
          "Order Cancelled",
          `Your order ${order.orderNumber} has been cancelled.`,
          "order",
          order._id
        );
      }
      if (io) {
        if (order?.customerId) io.to(order.customerId.toString()).emit("order:updated", order);
        io.to("cashier").emit("order:updated", order);
        io.to("kitchen").emit("order:updated", order);
      }
    } catch (e) {
      console.error("Failed to emit cancel events or send notifications", e);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateOwnOrder = async (req, res) => {
  try {
    const { updates } = req.body;
    console.log("req.user:", req.user);
    const order = await orderService.updateOwnOrder(
      req.user._id,
      req.params.id,
      updates
    );
    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Update own order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};
