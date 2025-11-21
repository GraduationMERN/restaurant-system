import mongoose from "mongoose";
import orderRepo from "./order.repository.js";
import { calculateTotal } from "./orderUtils.js";

class OrderService {
  async createOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    if (!orderData.isRewardOrder) {
      orderData.totalAmount = calculateTotal(orderData.items);
    } else {
      orderData.totalAmount = 0;
    }

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

  async updatePayment(orderId, paymentStatus, paymentMethod) {
    return await orderRepo.updatePayment(orderId, paymentStatus, paymentMethod);
  }

  async getOrdersForRestaurant(restaurantId, { status, isRewardOrder } = {}) {
    const filter = { restaurantId };
    if (status) filter.orderStatus = status;
    if (typeof isRewardOrder === "boolean") filter.isRewardOrder = isRewardOrder;
    return await orderRepo.search(filter);
  }

  async getOrdersForCustomer(customerId, { isRewardOrder } = {}) {
    const filter = { customerId };
    if (typeof isRewardOrder === "boolean") filter.isRewardOrder = isRewardOrder;
    return await orderRepo.search(filter);
  }

  async addItemToOrder(orderId, item) {
    return await orderRepo.addItem(orderId, item);
  }

  async updateOrderItems(orderId, items) {
    return await orderRepo.updateItems(orderId, items);
  }
}

export default new OrderService();
