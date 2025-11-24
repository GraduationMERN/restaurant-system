import mongoose from "mongoose";
import orderRepo from "./order.repository.js";
import { calculateTotal } from "./orderUtils.js";

class OrderService {
  // 1) Create Order
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
  // 2) Get Order by ID
  async getOrder(orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    return order;
  }
  // 3) Update Order Status
  async updateStatus(orderId, newStatus) {
    return await orderRepo.updateStatus(orderId, newStatus);
  }
  // 4) Update Payment (status, method, stripeSessionId)
  async updatePayment(orderId, paymentStatus, paymentMethod = null, stripeSessionId = null) {
    return await orderRepo.updatePayment(orderId, paymentStatus, paymentMethod, stripeSessionId);
  }
  // 5) Update Reward Points (after reward system calculates them)
  async updateRewardPoints(orderId, rewardPoints) {
    return await orderRepo.updateRewardPoints(orderId, rewardPoints);
  }

  // 6) Add Item to Existing Order
  async addItemToOrder(orderId, item) {
    return await orderRepo.addItem(orderId, item);
  }

  // 7) Replace All Items in Order
  async updateOrderItems(orderId, items) {
    return await orderRepo.updateItems(orderId, items);
  }

  // 8) Update Total Amount
  async updateTotal(orderId, totalAmount) {
    return await orderRepo.updateTotal(orderId, totalAmount);
  }

  // 9) Update Table Number
  async updateTable(orderId, tableNumber) {
    return await orderRepo.updateTable(orderId, tableNumber);
  }
  // 10) Update Service Type
  async updateServiceType(orderId, serviceType) {
    return await orderRepo.updateServiceType(orderId, serviceType);
  }

  // 11) Mark Order as Reward Order
  async markAsRewardOrder(orderId, isReward = true) {
    return await orderRepo.markAsRewardOrder(orderId, isReward);
  }

  // 12) Get Orders for Restaurant (supports filtering by status & reward)
  async getOrdersForRestaurant(restaurantId, { status, isRewardOrder } = {}) {
    const filter = { restaurantId };
    if (status) filter.orderStatus = status;
    if (typeof isRewardOrder === "boolean") filter.isRewardOrder = isRewardOrder;
    return await orderRepo.search(filter);
  }

  // 13) Get Orders for Customer (supports filtering by reward)
  // ==============================
  async getOrdersForCustomer(customerId, { isRewardOrder } = {}) {
    const filter = { customerId };
    if (typeof isRewardOrder === "boolean") filter.isRewardOrder = isRewardOrder;
    return await orderRepo.search(filter);
  }
}

export default new OrderService();
