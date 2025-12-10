import orderRepo from "./order.repository.js";
import Cart from "../cart/Cart.js";
import mongoose from "mongoose";
import { calculateOrderTotals, formatCartItemsForOrder, generateOrderNumber } from "./orderUtils.js";
import Order from "./orderModel.js";
import { earningPoints } from "../rewards/reward.service.js";
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
  // Create order from cart (with proper guest support)
  async createOrderFromCart(orderData) {
    const {
      cartId,
      serviceType,
      tableNumber,
      notes,
      paymentMethod = "online",
      customerInfo,
      deliveryLocation,
      customerId, // From controller
      isGuest, // From controller
      user // From controller
    } = orderData;

    // 1. Load cart
    const cart = await Cart.findById(cartId).populate("products.productId");
    if (!cart) throw new Error("Cart not found");
    if (!cart.products || cart.products.length === 0) throw new Error("Cart is empty");

    // 2. Format items
    const items = formatCartItemsForOrder(cart.products);

    // 3. Calculate totals
    const totals = calculateOrderTotals(items, 0.14, 0, 0);

    // 4. Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 5. Build order object
    const order = {
      cartId: cart._id,
      customerId: customerId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerType: isGuest ? "guest" : "registered",
      user: isGuest ? null : user,
      serviceType,
      tableNumber: serviceType === "dine-in" ? (tableNumber || "") : null,
      deliveryAddress: serviceType === "delivery" ? (deliveryLocation?.address || "") : "",
      items,
      subtotal: totals.subtotal,
      vat: totals.tax,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      orderNumber,
      notes: notes || "",
      estimatedTime: null, // Will be set by cashier
      customerInfo: {
        name: customerInfo?.name || "",
        phone: customerInfo?.phone || "",
        email: customerInfo?.email || ""
      },
      isDirectOrder: false
    };

    // 6. Create order
    const created = await orderRepo.create(order);

    // 7. Delete cart (optional)
    try {
      await Cart.findByIdAndDelete(cartId);
    } catch (e) {
      console.error("Failed to delete cart:", e);
    }

    return created;
  }

  // Create direct order (cashier)
  async createDirectOrder(orderData) {
    const {
      items,
      tableNumber,
      customerInfo,
      paymentMethod = "cash",
      notes,
      estimatedTime = 25,
      createdBy // Cashier ID
    } = orderData;

    // Validation
    if (!items || items.length === 0) throw new Error("Items are required");
    if (!serviceType) throw new Error("serviceType is required");
    if (serviceType === "dine-in" && !tableNumber) throw new Error("tableNumber is required for dine-in");

    // Calculate totals
    const totals = calculateOrderTotals(items, 0.14, 0, 0);

    // Generate guest ID for walk-in customer
    const guestId = `walkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const order = {
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image || "",
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || {},
        price: item.price,
        totalPrice: item.price * item.quantity
      })),
      customerId: guestId,
      customerType: "guest",
      user: null,
      serviceType,
      tableNumber: serviceType === "dine-in" ? tableNumber : null,
      deliveryAddress: serviceType === "delivery" ? (customerInfo?.address || "") : "",
      subtotal: totals.subtotal,
      vat: totals.tax,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      paymentMethod,
      paymentStatus: "paid", // Direct orders are paid immediately
      status: "confirmed", // Skip pending for direct orders
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      notes: notes || "",
      estimatedTime,
      estimatedReadyTime: new Date(Date.now() + estimatedTime * 60000),
      customerInfo: {
        name: customerInfo?.name || "Walk-in Customer",
        phone: customerInfo?.phone || "",
        email: customerInfo?.email || ""
      },
      createdBy,
      isDirectOrder: true
    };

    return await orderRepo.create(order);
  }

  // Get order by ID or order number
    async getOrder(identifier) {
    if (!identifier) return null;
    let order;
    // Check if ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
       order = await Order.findById(identifier)
        .populate('user', 'name email')
        .populate({
          path: 'items.productId',
          select: 'name productPoints price' // Select the fields you need
        });
    }
    else if (typeof identifier === 'string' && identifier.startsWith('ORD-')) {
      // Handle order number
      order = await Order.findOne({ orderNumber: identifier })
        .populate('user', 'name email')
        .populate({
          path: 'items.productId',
          select: 'name productPoints price'
        });
    }
    return order;
  }

  // ===== Other service methods =====
  async getOrdersByUser(userId) { return orderRepo.findByUserId(userId); }
  async getOrderByCartId(cartId) { return orderRepo.findByCartId(cartId); }
  async getActiveOrders() { return orderRepo.findActiveOrders(); }
  async getAllOrders() { return orderRepo.getAllOrders(); }
  //=========== cahrts
  async getOverviewStats(from, to) { return orderRepo.getOverviewStats(from, to); }
  async getDailyStats(days) { return orderRepo.getDailyStats(days); }
  async getTopItems(from, to, by) { return orderRepo.getTopItems(from, to, by); }
  async getRecentOrders(limit) { return orderRepo.getRecentOrders(limit); }
  // ==========
  async orderUpdate(orderId, updates) { return orderRepo.update(orderId, updates); }
  async updateStatus(orderId, newStatus) {
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid order status");
    }

    console.log(`Updating order ${orderId} to status: ${newStatus}`);

    // First update the order status
    const updatedOrder = await orderRepo.updateStatus(orderId, newStatus);

    console.log(`Order updated successfully, new status: ${updatedOrder.status}`);

    // Then award points if status is "completed"
    if (newStatus === "completed") {
      console.log(`Attempting to award points for completed order ${orderId}`);
      console.log(`Earning points function:`, earningPoints);

      try {
        await earningPoints(orderId);
        console.log(`Points successfully awarded for order ${orderId}`);
      } catch (error) {
        console.error(`Failed to award points for order ${orderId}:`, error);
      }
    }

    return updatedOrder;
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

    // Check if order number format
    if (identifier.startsWith('ORD-')) {
      return await orderRepo.findByOrderNumber(identifier);
    }

    // Try as string ID
    return await orderRepo.findById(identifier, true);
  }

  // Get orders by user (works for both guest and registered)
  async getOrdersByUser(customerId) {
    return await orderRepo.findByUserId(customerId, true);
  }

  // Get order by cart ID
  async getOrderByCartId(cartId) {
    return await orderRepo.findByCartId(cartId);
  }

  // Get active orders
  async getActiveOrders() {
    return await orderRepo.findActiveOrders();
  }

  // Get all orders with pagination
  async getAllOrders({ page = 1, limit = 50, status } = {}) {
    return await orderRepo.getAllOrders({ page, limit, status });
  }

  // Update order
  async orderUpdate(orderId, updates) {
    // Filter allowed updates
    const allowedUpdates = ["notes", "tableNumber", "customerInfo", "estimatedTime"];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    return await orderRepo.update(orderId, filteredUpdates);
  }

  // Update payment
  async updatePayment(orderId, paymentStatus, paymentMethod = null) {
    const validStatuses = ["pending", "paid", "failed", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const updates = { paymentStatus };
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    if (paymentStatus === "paid") updates.paidAt = new Date();
    if (paymentStatus === "refunded") updates.refundedAt = new Date();

    return await orderRepo.updatePaymentWithUser(orderId, updates);
  }

  // Update payment with options
  async updatePaymentWithOptions(orderId, paymentStatus, paymentMethod = null, options = {}) {
    const updates = { paymentStatus };
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    if (paymentStatus === "paid") updates.paidAt = new Date();
    if (paymentStatus === "refunded") {
      updates.refundAmount = options.refundAmount || 0;
      updates.refundedAt = new Date();
    }

    return await orderRepo.updatePaymentWithUser(orderId, updates);
  }

  // Cancel order by identity (customer)
  async cancelOrderByIdentity(orderId, identity = {}) {
    const { userId, guestId, phone } = identity;
    const order = await orderRepo.findById(orderId);

    if (!order) throw new Error("Order not found");

    // Check ownership
    if (userId && order.customerId === userId) {
      // Registered user owns order
    } else if (guestId && order.customerId === guestId) {
      // Guest owns order
    } else if (phone && order.customerInfo?.phone === phone) {
      // Phone matches
    } else {
      throw new Error("You can only cancel your own order");
    }

    // Check if cancellable
    if (!["pending", "confirmed"].includes(order.status)) {
      throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    return await orderRepo.cancelOrder(orderId);
  }

  // Update customer info
  async updateCustomerInfo(orderId, customerInfo) {
    return await orderRepo.updateCustomerInfo(orderId, customerInfo);
  }

  // Link guest order to registered user
  async linkUserToOrder(orderId, userId) {
    return await orderRepo.updateUserId(orderId, userId);
  }

  // Search orders
  async searchOrders(filter = {}, options = {}) {
    return await orderRepo.search(filter, options);
  }

  // Delete order (admin/cashier)
  async deleteOrder(orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (order.status === "completed") {
      throw new Error("Cannot delete completed orders");
    }

    return await orderRepo.delete(orderId);
  }

  // Cancel own order (customer)
  async cancelOwnOrder(userId, orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (order.customerId !== userId) {
      throw new Error("You can only cancel your own order");
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    return await orderRepo.cancelOrder(orderId);
  }

  // Update own order (customer)
  async updateOwnOrder(userId, orderId, updates) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (order.customerId !== userId) {
      throw new Error("You can only update your own order");
    }

    if (order.status !== "pending") {
      throw new Error("Cannot modify order after confirmation");
    }

    const allowedUpdates = ["notes", "tableNumber", "customerInfo"];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    return await orderRepo.update(orderId, filteredUpdates);
  }
}

export default new OrderService();
