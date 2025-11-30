import orderService from "./order.service.js";
import { notificationService } from "../../../server.js";

// CREATE ORDERS
export const createOrderFromCart = async (req, res) => {
  try {
    const { cart, productDetails, orderData } = req.body;
    const order = await orderService.createOrderFromCart(cart, productDetails, orderData);

    await notificationService.sendToAdmin({
      title: "New Order",
      message: `A new order was created by ${order.customerInfo.name || "Guest"}`,
      orderId: order._id,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const createDirectOrder = async (req, res) => {
  try {
    const order = await orderService.createDirectOrder(req.body);

    await notificationService.sendToAdmin({
      title: "New Order",
      message: `A new order was created by ${order.customerInfo.name || "Guest"}`,
      orderId: order._id,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET ORDERS
export const getOrder = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.getOrder(req.params.id) });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.getOrdersByUser(req.params.userId) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getOrderByCartId = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.getOrderByCartId(req.params.cartId) });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const getActiveOrders = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.getActiveOrders() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ADMIN/CASHIER UPDATES
export const updateOrderStatus = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.updateStatus(req.params.id, req.body.orderStatus) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.updatePayment(req.params.id, req.body.paymentStatus, req.body.paymentMethod) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCustomerInfo = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.updateCustomerInfo(req.params.id, req.body.customerInfo) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const linkUserToOrder = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.linkUserToOrder(req.params.id, req.body.userId) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// SEARCH / DELETE
// ==============================
export const searchOrders = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.searchOrders(req.body.filter, req.body.options) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.deleteOrder(req.params.id) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    res.json({ success: true, data: await orderService.getAllOrders() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// CUSTOMER-ONLY UPDATES
export const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOwnOrder(req.user._id, req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateOwnOrder = async (req, res) => {
  try {
    const order = await orderService.updateOwnOrder(req.user._id, req.params.id, req.body.updates);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
