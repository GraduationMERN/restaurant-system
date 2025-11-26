import mongoose from "mongoose";
import orderRepo from "./order.repository.js";
import { calculateOrderTotal } from "./orderUtils.js";

class OrderService {
  async createOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    // Calculate pricing
    const totals = calculateOrderTotal(
      orderData.items, 
      orderData.taxRate || 0, 
      orderData.deliveryFee || 0, 
      orderData.discount || 0
    );
    
    orderData = { ...orderData, ...totals };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newOrder = await orderRepo.create(orderData, session);
      await session.commitTransaction();
      session.endSession();
      return newOrder;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async getOrder(orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    return order;
  }

  async updateStatus(orderId, newStatus) {
    return await orderRepo.updateStatus(orderId, newStatus);
  }

  async updatePayment(orderId, paymentStatus, paymentMethod = null) {
    return await orderRepo.updatePayment(orderId, paymentStatus, paymentMethod);
  }

  async updateCustomerInfo(orderId, customerInfo) {
    return await orderRepo.updateCustomerInfo(orderId, customerInfo);
  }

  async linkUserToOrder(orderId, userId) {
    return await orderRepo.linkUserToOrder(orderId, userId);
  }

  async addItem(orderId, item) {
    return await orderRepo.addItem(orderId, item);
  }

  async updateItems(orderId, items) {
    return await orderRepo.updateItems(orderId, items);
  }

  async updatePricing(orderId, { subtotal, tax, deliveryFee, discount, totalAmount }) {
    return await orderRepo.updatePricing(orderId, {
      subtotal,
      tax,
      deliveryFee,
      discount,
      totalAmount
    });
  }

  async updateTable(orderId, tableNumber) {
    return await orderRepo.updateTable(orderId, tableNumber);
  }

  async updateServiceType(orderId, serviceType) {
    return await orderRepo.updateServiceType(orderId, serviceType);
  }

  async updateNotes(orderId, notes) {
    return await orderRepo.updateNotes(orderId, notes);
  }

  async getOrdersByUser(userId, { status } = {}) {
    return await orderRepo.listByUser(userId, { status });
  }

  async getOrdersByStatus(status) {
    return await orderRepo.listByStatus(status);
  }

  async getTodaysOrders() {
    return await orderRepo.getTodaysOrders();
  }

  async getOrdersByPaymentStatus(paymentStatus) {
    return await orderRepo.listByPaymentStatus(paymentStatus);
  }

  async searchOrders(filter = {}) {
    return await orderRepo.search(filter);
  }
}

export default new OrderService();