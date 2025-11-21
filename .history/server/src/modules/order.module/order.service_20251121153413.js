import mongoose from "mongoose";
import orderRepo from "./order.repository.js";
import { calculateTotal, calculateRewardPoints, calculatePointsCost } from "./orderUtils.js";

class OrderService {
  async createOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (orderData.isRewardOrder) {
        // لو الطلب من Reward Menu
        const pointsCost = calculatePointsCost(orderData.items);
        orderData.totalAmount = 0; // ما فيش فلوس تدفع في الطلب من Reward Menu
        orderData.rewardPointsSpent = pointsCost; // نخزن النقاط المستهلكة
      } else {
        // الطلب العادي
        const total = calculateTotal(orderData.items);
        orderData.totalAmount = total;
        orderData.rewardPointsEarned = calculateRewardPoints(orderData.items);
      }

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
    const updatedOrder = await orderRepo.addItem(orderId, item);
    // تحديث المجموع أو النقاط بعد الإضافة
    if (!updatedOrder.isRewardOrder) {
      const total = calculateTotal(updatedOrder.items);
      const rewardPoints = calculateRewardPoints(updatedOrder.items);
      await orderRepo.updateTotal(orderId, total);
      await orderRepo.updateRewardPoints(orderId, rewardPoints);
    }
    return updatedOrder;
  }

  async updateOrderItems(orderId, items) {
    const updatedOrder = await orderRepo.updateItems(orderId, items);
    if (!updatedOrder.isRewardOrder) {
      const total = calculateTotal(updatedOrder.items);
      const rewardPoints = calculateRewardPoints(updatedOrder.items);
      await orderRepo.updateTotal(orderId, total);
      await orderRepo.updateRewardPoints(orderId, rewardPoints);
    } else {
      const pointsCost = calculatePointsCost(updatedOrder.items);
      updatedOrder.rewardPointsSpent = pointsCost;
    }
    return updatedOrder;
  }
}

export default new OrderService();
