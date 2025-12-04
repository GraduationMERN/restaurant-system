import orderRepo from "./order.repository.js";
import Cart from "../cart/Cart.js";
import mongoose from "mongoose";
import { calculateOrderTotals, formatCartItemsForOrder, generateOrderNumber } from "./orderUtils.js";
import { calculateRewardPoints, earningPoints } from "../rewards/reward.service.js";
const calculateEstimatedReadyTime = (serviceType, itemsCount, baseTime = 15) => {
  const now = new Date();
  
  // Base preparation time (in minutes)
  let preparationTime = baseTime;
  
  // Add time based on order type
  if (serviceType === "delivery") preparationTime += 10;
  else if (serviceType === "dine-in") preparationTime += 5;
  else if (serviceType === "pickup") preparationTime += 3;
  
  // Add time based on items count
  preparationTime += Math.floor(itemsCount / 2) * 5;
  
  // Set maximum
  preparationTime = Math.min(preparationTime, 45);
  
  return new Date(now.getTime() + preparationTime * 60000);
};
class OrderService {

  // Create order from cart
  async createOrderFromCart(orderData, identity = {}) {
    const { cartId, serviceType, tableNumber, notes, paymentMethod, customerInfo } = orderData;
    const { user: reqUser = null, guestId = null } = identity;

    // 1. Load cart with product population
    const cart = await Cart.findById(cartId).populate("products.productId");
    if (!cart) throw new Error("Cart not found");
    if (!cart.products || cart.products.length === 0) throw new Error("Cart is empty");

    // 2. Format items
    const items = formatCartItemsForOrder(cart.products);

    // 3. Calculate totals
    const totals = calculateOrderTotals(items, 0.14, 0, 0);

    // 4. Identity handling
    const orderUserIdString = cart.userId ?? (reqUser ? reqUser._id.toString() : guestId ?? null);
    const customerId = reqUser ? new mongoose.Types.ObjectId(reqUser._id) : null;
    const createdBy = reqUser ? new mongoose.Types.ObjectId(reqUser._id) : null;

    // 5. Build order object
    const order = {
      cartId: cart._id,
      userId: orderUserIdString,
      customerId: customerId ? new mongoose.Types.ObjectId(customerId) : null,
      serviceType,
      tableNumber: serviceType === "dine-in" ? String(tableNumber ?? "") : null,
      items,
      subtotal: totals.subtotal,
      vat: totals.tax,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: "pending",
      status: "pending",
      orderNumber: generateOrderNumber(),
      notes: notes || "",
      estimatedTime: 25,
      customerInfo: {
        name: (customerInfo && customerInfo.name) || (reqUser?.name) || "",
        phone: (customerInfo && customerInfo.phone) || (reqUser?.phoneNumber?.toString()) || "",
        email: (customerInfo && customerInfo.email) || (reqUser?.email) || "",
      }
    }
    const created = await orderRepo.create(order);
    return created;
  }
  //////////////////////////////////////////////////////////////////////////diresct order
  async createDirectOrder(orderData, identity = {}) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    const { user: reqUser = null } = identity;

    // Calculate totals
    const totals = calculateOrderTotals(
      orderData.items,
      orderData.taxRate ?? 0.14,
      orderData.deliveryFee ?? 0,
      orderData.discount ?? 0
    );

    const customerId = reqUser ? new mongoose.Types.ObjectId(reqUser._id) : null;

    const order = {
      ...orderData,
      isDirectOrder: true, // important to skip cartId requirement
      userId: orderData.userId ?? (reqUser ? reqUser._id.toString() : null),
      customerId,
      subtotal: totals.subtotal,
      vat: totals.tax,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      paymentStatus: "pending",
      status: "pending",
      orderNumber: generateOrderNumber(),
    };

    // Ensure each item has unit price and totalPrice
    order.items = order.items.map(item => ({
      ...item,
      price: item.price ?? item.totalPrice / item.quantity,
      totalPrice: item.totalPrice
    }));

    const created = await orderRepo.create(order);
    return created;
  }


  // ===== Other service methods =====
  async getOrder(orderId) { return orderRepo.findById(orderId, true); }
  async getOrdersByUser(userId) { return orderRepo.findByUserId(userId); }
  async getOrderByCartId(cartId) { return orderRepo.findByCartId(cartId); }
  async getActiveOrders() { return orderRepo.findActiveOrders(); }
  async getAllOrders() { return orderRepo.getAllOrders(); }
  async orderUpdate(orderId, updates) { return orderRepo.update(orderId, updates); }
  async updateStatus(orderId, newStatus) {
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(newStatus)) {throw new Error("Invalid order status");}
    if (newStatus === "completed") { await earningPoints(orderId); }
    return orderRepo.updateStatus(orderId, newStatus);
  }
  

  async updatePayment(orderId, paymentStatus, paymentMethod = null) {
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
    if (!validPaymentStatuses.includes(paymentStatus)) throw new Error("Invalid payment status");
    const updates = { paymentStatus };
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    if (paymentStatus === "paid") updates.paidAt = new Date();
    return orderRepo.updatePayment(orderId, updates);
  }

  async updateCustomerInfo(orderId, customerInfo) {
    const allowedFields = ["name", "phone", "email", "address"];
    const filteredInfo = {};
    Object.keys(customerInfo || {}).forEach(key => {
      if (allowedFields.includes(key)) filteredInfo[key] = customerInfo[key];
    });
    return orderRepo.updateCustomerInfo(orderId, filteredInfo);
  }

  async linkUserToOrder(orderId, userId) { return orderRepo.updateUserId(orderId, userId); }
  async searchOrders(filter = {}, options = {}) { return orderRepo.search(filter, options); }
  async deleteOrder(orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status === "completed") throw new Error("Cannot delete completed orders");
    return orderRepo.delete(orderId);
  }

  async cancelOwnOrder(userId, orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId.toString() !== userId.toString())
      throw new Error("You can only cancel your own order");
    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(order.status))
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    return orderRepo.cancelOrder(orderId);
  }

  async updateOwnOrder(userId, orderId, updates) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Check ownership
    if (order.userId.toString() !== userId.toString()) {
      throw new Error("You can only update your own order");
    }

    // Only allow editing while order is still draft / pending
    if (order.status !== "pending") {
      throw new Error("Cannot modify an order after submission");
    }

    // Only allow certain fields to be updated
    const allowedFields = ["notes", "tableNumber", "customerInfo", "items"];

    const filteredUpdates = {};
    Object.keys(updates || {}).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    return orderRepo.update(orderId, filteredUpdates);
  }
}

export default new OrderService();