import orderRepo from "./order.repository.js";
import { calculateOrderTotals, formatCartItemsForOrder } from "./orderUtils.js";
import { getProductById } from "../product/product.repository.js";
import * as rewardService from "../rewards/reward.service.js";
import * as couponService from "../coupon/coupon.service.js";

class OrderService {
  // ==============================
  // CREATE ORDERS
  // ==============================
  async createOrderFromCart(cart, productDetails, orderData) {
    if (!cart.products || cart.products.length === 0) throw new Error("Cart is empty");

    const items = formatCartItemsForOrder(cart.products, productDetails);
    const totals = calculateOrderTotals(items, orderData.taxRate, orderData.deliveryFee, orderData.discount);

    const order = {
      cartId: cart._id,
      userId: cart.userId,
      createdBy: cart.userId,
      orderSource: "cart",
      isDirectOrder: false,
      items,
      serviceType: orderData.serviceType,
      tableNumber: orderData.tableNumber,
      paymentMethod: orderData.paymentMethod,
      customerInfo: orderData.customerInfo || {},
      notes: orderData.notes || "",
      ...totals
    };

    return orderRepo.create(order);
  }

  async createDirectOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) throw new Error("Order must contain at least one item.");

    const totals = calculateOrderTotals(orderData.items, orderData.taxRate, orderData.deliveryFee, orderData.discount);

    const order = {
      ...orderData,
      createdBy: orderData.userId || "guest",
      orderSource: orderData.orderSource || "direct",
      isDirectOrder: true,
      ...totals
    };

    return orderRepo.create(order);
  }

  // ==============================
  // GET ORDERS
  // ==============================
  async getOrder(orderId) {
    return orderRepo.findById(orderId, true);
  }

  async getOrdersByUser(userId) {
    return orderRepo.findByUserId(userId);
  }

  async getOrderByCartId(cartId) {
    return orderRepo.findByCartId(cartId);
  }

  async getActiveOrders() {
    return orderRepo.findActiveOrders();
  }

  // ==============================
  // ADMIN / CASHIER UPDATES
  // ==============================
  async updateStatus(orderId, newStatus) {
    return orderRepo.updateStatus(orderId, newStatus);
  }

  async updatePayment(orderId, paymentStatus, paymentMethod) {
    return orderRepo.updatePayment(orderId, paymentStatus, paymentMethod);
  }

  async updateCustomerInfo(orderId, customerInfo) {
    return orderRepo.updateCustomerInfo(orderId, customerInfo);
  }

  async linkUserToOrder(orderId, userId) {
    return orderRepo.updateUserId(orderId, userId);
  }

  async searchOrders(filter = {}, options = {}) {
    return orderRepo.search(filter, options);
  }

  async deleteOrder(orderId) {
    return orderRepo.delete(orderId);
  }

  async getAllOrders() {
    return orderRepo.getAllOrders();
  }

  // ==============================
  // CUSTOMER-ONLY UPDATES
  // ==============================
  async cancelOwnOrder(userId, orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId.toString() !== userId.toString()) throw new Error("You can only cancel your own order");

    // Only allow cancellation if status allows
    if (["completed", "cancelled"].includes(order.orderStatus)) {
      throw new Error("Cannot cancel completed or already cancelled order");
    }

    return orderRepo.updateStatus(orderId, "cancelled");
  }

  async updateOwnOrder(userId, orderId, updates) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId.toString() !== userId.toString()) throw new Error("You can only update your own order");

    // Only allow certain fields to be updated by the customer
    const allowedFields = ["notes", "customerInfo", "deliveryAddress"];
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) filteredUpdates[key] = updates[key];
    });

    return orderRepo.update(orderId, filteredUpdates);
  }
}

export default new OrderService();
