import mongoose from "mongoose";
import orderRepo from "./order.repository.js";
import { calculateTotal } from "./orderUtils.js";

class OrderService {
  // =============================
  // CREATE ORDER
  // =============================
  async createOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    // calculate total from items
    const total = calculateTotal(orderData.items);
    orderData.totalAmount = total;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newOrder = await orderRepo.create(orderData, session);

      // مثال: لو عندك points system
      // newOrder.rewardPointsEarned = Math.floor(total / 10);

      await session.commitTransaction();
      session.endSession();

      return newOrder;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // =============================
  // GET ORDER
  // =============================
  async getOrder(orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    return order;
  }

  // =============================
  // UPDATE STATUS
  // =============================
  async updateStatus(orderId, newStatus) {
    return await orderRepo.updateStatus(orderId, newStatus);
  }

  // =============================
  // UPDATE PAYMENT
  // =============================
  async updatePayment(orderId, paymentStatus, paymentMethod) {
    return await orderRepo.updatePayment(orderId, paymentStatus, paymentMethod);
  }

  // =============================
  // LIST FOR RESTAURANT
  // =============================
  async getOrdersForRestaurant(restaurantId) {
    return await orderRepo.listByRestaurant(restaurantId);
  }

  // =============================
  // LIST FOR CUSTOMER
  // =============================
  async getOrdersForCustomer(customerId) {
    return await orderRepo.listByCustomer(customerId);
  }
}

export default new OrderService();
