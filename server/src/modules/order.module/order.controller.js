import orderService from "./order.service.js";
import { notificationService } from "../../../server.js"
export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);
    await notificationService.sendToAdmin({
      title: "New Order",
      message: `A new order was created by ${order.customerName || "Guest"}`,
      orderId: order._id,
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const updated = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const updated = await orderService.updatePayment(
      req.params.id,
      req.body.paymentStatus,
      req.body.paymentMethod
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getOrdersForRestaurant = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForRestaurant(req.params.restaurantId);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getOrdersForCustomer = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForCustomer(req.params.customerId);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
