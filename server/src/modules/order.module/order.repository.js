import Order from "./orderModel.js";


class OrderRepository {
  // ==============================
  // CREATE
  // ==============================
  async create(orderData) {
    return Order.create(orderData);
  }

  // ==============================
  // READ
  // ==============================
  async findById(orderId, populateProducts = false) {
    let query = Order.findById(orderId);
    if (populateProducts) {
      query = query
        .populate("items.productId")
        .populate("userId", "name email phone")
        .populate("cartId");
    }
    return query.exec();
  }

  async findByUserId(userId) {
    return Order.find({ userId })
      .populate("items.productId")
      .populate("cartId")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCartId(cartId) {
    return Order.findOne({ cartId })
      .populate("items.productId")
      .populate("userId", "name email phone")
      .exec();
  }

  async findActiveOrders() {
    return Order.find({ status: { $in: ["pending", "confirmed", "preparing"] } })
      .populate("items.productId")
      .populate("userId", "name email phone")
      .sort({ createdAt: 1 })
      .exec();
  }

  async findByStatus(status) {
    return Order.find({ status })
      .populate("items.productId")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllOrders() {
    return Order.find()
      .populate("items.productId", "name price")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .exec();
  }

  // ==============================
  // UPDATE
  // ==============================
  async updateStatus(orderId, newStatus) {
    return Order.findByIdAndUpdate(
      orderId,
      { status: newStatus, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId")
    .populate("userId", "name email phone");
  }

  async updatePayment(orderId, updates) {
    return Order.findByIdAndUpdate(
      orderId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId")
    .populate("userId", "name email phone");
  }

  async updateCustomerInfo(orderId, customerInfo) {
    return Order.findByIdAndUpdate(
      orderId,
      { customerInfo, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId")
    .populate("userId", "name email phone");
  }

  async updateUserId(orderId, newUserId) {
    return Order.findByIdAndUpdate(
      orderId,
      { userId: newUserId, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId")
    .populate("userId", "name email phone");
  }

  async update(orderId, updates) {
    return Order.findByIdAndUpdate(
      orderId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId")
    .populate("userId", "name email phone");
  }

  async cancelOrder(orderId) {
    return Order.findByIdAndUpdate(
      orderId,
      { status: "cancelled", updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId")
    .populate("userId", "name email phone");
  }

  // ==============================
  // DELETE
  // ==============================
  async delete(orderId) {
    return Order.findByIdAndDelete(orderId);
  }

  // ==============================
  // SEARCH / FILTER / PAGINATION
  // ==============================
  async search(filter = {}, options = {}) {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
    return Order.find(filter)
      .populate("items.productId")
      .populate("userId", "name email phone")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findByDateRange(startDate, endDate) {
    return Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate("items.productId")
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 })
    .exec();
  }

  // ==============================
  // STATISTICS
  // ==============================
  async getOrderStats() {
    return Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);
  }

  // ==============================
  // NEW FUNCTIONS FOR PAYMENT SERVICE
  // ==============================

  /**
   * Update Stripe Session ID (supports optional transaction)
   */
  async updateStripeSessionId(orderId, sessionId, opts = {}) {
    return Order.findByIdAndUpdate(
      orderId,
      { stripeSessionId: sessionId },
      { new: true, ...(opts.session && { session: opts.session }) }
    );
  }

  /**
   * Create a Payment Log for auditing
   */
  // async createPaymentLog(orderId, payload, opts = {}) {
  //   if (!PaymentLog) return null; // optional
  //   return PaymentLog.create([{ orderId, ...payload }], {
  //     ...(opts.session && { session: opts.session })
  //   });
  // }
}

export default new OrderRepository();
