import orderRepo from "./orderRepository.js";
import { calculateOrderTotals, formatCartItemsForOrder } from "./orderUtils.js";

class OrderService {
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

  async getOrder(orderId) { return orderRepo.findById(orderId, true); }
  async getOrdersByUser(userId) { return orderRepo.findByUserId(userId); }
  async getOrderByCartId(cartId) { return orderRepo.findByCartId(cartId); }
  async getActiveOrders() { return orderRepo.findActiveOrders(); }
  async updateStatus(orderId, newStatus) { return orderRepo.updateStatus(orderId, newStatus); }
  async updatePayment(orderId, paymentStatus, paymentMethod) { return orderRepo.updatePayment(orderId, paymentStatus, paymentMethod); }
  async updateCustomerInfo(orderId, customerInfo) { return orderRepo.updateCustomerInfo(orderId, customerInfo); }
  async linkUserToOrder(orderId, userId) { return orderRepo.updateUserId(orderId, userId); }
  async searchOrders(filter = {}, options = {}) { return orderRepo.search(filter, options); }
  async deleteOrder(orderId) { return orderRepo.delete(orderId); }
  async getAllOrders() { return orderRepo.getAllOrders(); }
}

export default new OrderService();
