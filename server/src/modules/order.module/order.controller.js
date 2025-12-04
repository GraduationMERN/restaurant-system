import orderService from "./order.service.js";
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

    // Emit order creation to rooms for real-time updates
    try {
      if (io) {
        io.to("cashier").emit("order:update", order);
        io.to("kitchen").emit("order:update", order);
        if (order?.customerId) io.to(order.customerId.toString()).emit("order:update", order);
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
    const order = await orderService.createDirectOrder(req.body);

    await notificationService?.sendToAdmin({
      title: "New Direct Order",
      message: `A new direct order was created by ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
    });
    // Notify cashiers as well
    await notificationService?.sendToRole("cashier", {
      title: "New Direct Order",
      message: `Direct order created by ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
    });

    try {
      if (io) {
        io.to("cashier").emit("order:update", order);
        io.to("kitchen").emit("order:update", order);
        if (order?.customerId) io.to(order.customerId.toString()).emit("order:update", order);
      }
    } catch (e) {
      console.error("Failed to emit direct order creation events", e);
    }

    res.status(201).json({ success: true, data: order });
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

      // Emit order:update to customer + cashier + kitchen rooms
      if (io) {
        if (order?.customerId) io.to(order.customerId.toString()).emit("order:update", order);
        io.to("cashier").emit("order:update", order);
        io.to("kitchen").emit("order:update", order);

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

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const order = await orderService.updatePayment(
      req.params.id,
      paymentStatus,
      paymentMethod
    );
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
    const order = await orderService.cancelOwnOrder(req.user._id, req.params.id);
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
