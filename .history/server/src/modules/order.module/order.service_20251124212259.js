import mongoose from "mongoose";
import orderRepo from "./order.repository.js";
import { calculateOrderTotal } from "./orderUtils.js";
// import { calculateTotal } from "./orderUtils.js";


class OrderService {
  // 1) Create Order
  async createOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    // Calculate subtotal, tax, delivery, tip, discount, totalAmount
    if (!orderData.isRewardOrder) {
      const totals = calculateOrderTotal(orderData.items, orderData.tax, orderData.tip, orderData.deliveryFee, orderData.discount);
      orderData = { ...orderData, ...totals };
    } else {
      // For reward orders, totalAmount is 0
      orderData.subtotal = 0;
      orderData.tax = 0;
      orderData.tip = 0;
      orderData.deliveryFee = 0;
      orderData.discount = 0;
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

  // 4) Update Payment (status, method, stripeSessionId, stripeCheckoutSessionId)
  async updatePayment(orderId, paymentStatus, paymentMethod = null, stripeSessionId = null, stripeCheckoutSessionId = null) {
    return await orderRepo.updatePayment(orderId, paymentStatus, paymentMethod, stripeSessionId, stripeCheckoutSessionId);
  }

  // 5) Update Reward Points
  async updateRewardPoints(orderId, rewardPoints) {
    return await orderRepo.updateRewardPoints(orderId, rewardPoints);
  }

  // 6) Update Pricing Breakdown
  async updatePricing(orderId, { subtotal, tax, tip, deliveryFee, discount, totalAmount, couponCode }) {
    const updateData = { subtotal, tax, tip, deliveryFee, discount, totalAmount, couponCode };
    return await orderRepo.update(orderId, updateData);
  }

  // 7) Add Item to Existing Order
  async addItem(orderId, item) {
    return await orderRepo.addItem(orderId, item);
  }

  // 8) Replace All Items in Order
  async updateItems(orderId, items) {
    return await orderRepo.updateItems(orderId, items);
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

  // 12) Get Orders for Restaurant
  async getOrdersForRestaurant(restaurantId, { status, isRewardOrder } = {}) {
    const filter = { restaurantId };
    if (status) filter.orderStatus = status;
    if (typeof isRewardOrder === "boolean") filter.isRewardOrder = isRewardOrder;
    return await orderRepo.search(filter);
  }

  // 13) Get Orders for Customer
  async getOrdersForCustomer(customerId, { isRewardOrder } = {}) {
    const filter = { customerId };
    if (typeof isRewardOrder === "boolean") filter.isRewardOrder = isRewardOrder;
    return await orderRepo.search(filter);
  }
}

export default new OrderService();
