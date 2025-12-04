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
      .populate("items.productId")
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

  //for charts
  async getOverviewStats(from = null, to = null) {
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }
    const pipeline = [
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                orderCount: { $sum: 1 },
              }
            }
          ],
          statusCounts: [
            {
              $group: { _id: "$status", count: { $sum: 1 } }
            }
          ],
          customers: [
            { $match: { userId: { $exists: true, $ne: null, $ne: "" } } },
            { $group: { _id: "$userId" } },
            { $count: "customersCount" }
          ]
        }
      }
    ];
    const [res] = await Order.aggregate(pipeline);
    const totals = (res?.totals?.[0]) || { totalRevenue: 0, orderCount: 0 };
    const statusCounts = res?.statusCounts || [];
    const customersCount = res?.customers?.[0]?.customersCount || 0;
    return { ...totals, statusCounts, customersCount };
  }

  async getDailyStats(days = 7) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (Number(days) - 1));
    return Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async getTopItems(from = null, to = null, by = "product") {
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }
    const pipeline = [
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: by === "category" ? "$items.productId" : "$items.productId",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
      // optional lookup to product for category
      ...(by === "category"
        ? [
          { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
          { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
          { $group: { _id: "$product.categoryId", quantity: { $sum: "$quantity" }, revenue: { $sum: "$revenue" } } },
          { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
          { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
          { $project: { label: "$category.name", quantity: 1, revenue: 1 } },
          { $sort: { quantity: -1 } },
        ]
        : [
          { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
          { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
          { $project: { label: { $ifNull: ["$product.name", "$name"] }, quantity: 1, revenue: 1 } },
        ]
      )
    ];
    return Order.aggregate(pipeline);
  }

  async getRecentOrders(limit = 5) {
    const parsed = parseInt(limit, 10);
    const l = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
    return Order.find({}, {
      orderNumber: 1,
      customerInfo: 1,
      items: 1,
      totalAmount: 1,
      status: 1,
      createdAt: 1,
    })
      .populate("items.productId", "name")
      .sort({ createdAt: -1 })
      .limit(l)
      .lean()
      .exec();
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

}

export default new OrderRepository();
