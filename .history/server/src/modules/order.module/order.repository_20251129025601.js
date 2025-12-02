import Order from "./orderModel.js";

class OrderRepository {
  async create(orderData) {
    return Order.create(orderData);
  }

  async findById(orderId, populateProducts = false) {
    let query = Order.findById(orderId);
    if (populateProducts) query = query.populate("items.productId");
    return query.exec();
  }

  async findByUserId(userId) {
    return Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCartId(cartId) {
    return Order.findOne({ cartId })
      .populate("items.productId")
      .exec();
  }

  async findActiveOrders() {
    return Order.find({ orderStatus: { $in: ["pending", "preparing", "ready"] } })
      .populate("items.productId")
      .sort({ createdAt: 1 })
      .exec();
  }

  async getAllOrders() {
    return Order.find().populate("items.productId");
  }

  async updateStatus(orderId, newStatus) {
    return Order.findByIdAndUpdate(
      orderId,
      { orderStatus: newStatus },
      { new: true }
    ).populate("items.productId");
  }

  async updatePayment(orderId, paymentStatus, paymentMethod = null, stripeSessionId = null) {
    const update = { paymentStatus };
    if (paymentMethod) update.paymentMethod = paymentMethod;
    if (stripeSessionId) update.stripeSessionId = stripeSessionId;

    return Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).populate("items.productId");
  }

  async updateCustomerInfo(orderId, customerInfo) {
    return Order.findByIdAndUpdate(
      orderId,
      { customerInfo },
      { new: true }
    ).populate("items.productId");
  }

  async updateUserId(orderId, newUserId) {
    return Order.findByIdAndUpdate(
      orderId,
      { userId: newUserId },
      { new: true }
    ).populate("items.productId");
  }

  async updateOwnOrder(userId, orderId, updates) {
    return Order.findOneAndUpdate(
      { _id: orderId, userId },
      updates,
      { new: true }
    ).populate("items.productId");
  }

  async cancelOwnOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId }).populate("items.productId");
    if (!order) throw new Error("Order not found or you don't have permission");

    if (["completed", "cancelled"].includes(order.orderStatus)) {
      throw new Error("Cannot cancel completed or already cancelled order");
    }

    order.orderStatus = "cancelled";
    return order.save();
  }

// SEARCH with filtering, pagination, sorting
  async search(filter = {}, options = {}) {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
    return Order.find(filter)
      .populate("items.productId")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async delete(orderId) {
    return Order.findByIdAndDelete(orderId).populate("items.productId");
  }
}

export default new OrderRepository();
