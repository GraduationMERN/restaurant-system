import mongoose from "mongoose";
import orderRepo from "./order.repository.js";
import { calculateOrderTotals, formatCartItemsForOrder } from "./orderUtils.js";

class OrderService {
  // CREATE ORDER FROM CART
  async createOrderFromCart(cart, productDetails, orderData) {
    if (!cart.products || cart.products.length === 0) {
      throw new Error("Cart is empty");
    }

    // Format cart items for order (add product names, images)
    const orderItems = formatCartItemsForOrder(cart.products, productDetails);

    // Calculate totals
    const totals = calculateOrderTotals(
      cart.products,
      orderData.taxRate || 0.1,
      orderData.deliveryFee || 0,
      orderData.discount || 0
    );

    const order = {
      cartId: cart._id,
      userId: cart.userId, // Same as cart userId
      serviceType: orderData.serviceType,
      tableNumber: orderData.tableNumber,
      items: orderItems,
      paymentMethod: orderData.paymentMethod,
      customerInfo: orderData.customerInfo || {},
      notes: orderData.notes || "",
      ...totals
    };

    return await orderRepo.create(order);
  }

  // CREATE DIRECT ORDER (without cart)
  async createDirectOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    const totals = calculateOrderTotals(
      orderData.items,
      orderData.taxRate || 0.1,
      orderData.deliveryFee || 0,
      orderData.discount || 0
    );

    const orderWithTotals = {
      ...orderData,
      ...totals
    };

    return await orderRepo.create(orderWithTotals);
  }

  // GET ORDER BY ID
  async getOrder(orderId) {
    const order = await orderRepo.findById(orderId, true); // Populate products
    if (!order) throw new Error("Order not found");
    return order;
  }

  // GET ORDERS BY USER
  async getOrdersByUser(userId) {
    return await orderRepo.findByUserId(userId);
  }

  // GET ORDER BY CART ID
  async getOrderByCartId(cartId) {
    return await orderRepo.findByCartId(cartId);
  }

  // GET ACTIVE ORDERS (for kitchen)
  async getActiveOrders() {
    return await orderRepo.findActiveOrders();
  }

  // UPDATE ORDER STATUS
  async updateStatus(orderId, newStatus) {
    const order = await orderRepo.updateStatus(orderId, newStatus);
    if (!order) throw new Error("Order not found");
    return order;
  }

  // UPDATE PAYMENT STATUS
  async updatePayment(orderId, paymentStatus, paymentMethod) {
    const order = await orderRepo.updatePayment(orderId, paymentStatus, paymentMethod);
    if (!order) throw new Error("Order not found");
    return order;
  }

  // UPDATE CUSTOMER INFO
  async updateCustomerInfo(orderId, customerInfo) {
    const order = await orderRepo.updateCustomerInfo(orderId, customerInfo);
    if (!order) throw new Error("Order not found");
    return order;
  }

  // LINK USER TO ORDER (when guest registers)
  async linkUserToOrder(orderId, newUserId) {
    const order = await orderRepo.updateUserId(orderId, newUserId);
    if (!order) throw new Error("Order not found");
    return order;
  }

  // SEARCH ORDERS
  async searchOrders(filter = {}, options = {}) {
    return await orderRepo.search(filter, options);
  }

  // DELETE ORDER
  async deleteOrder(orderId) {
    const order = await orderRepo.delete(orderId);
    if (!order) throw new Error("Order not found");
    return order;
  }

  // 14) GET all orders
  async getAllOrders(){
    return await orderRepo.getAllOrders()
  }
}

export default new OrderService();