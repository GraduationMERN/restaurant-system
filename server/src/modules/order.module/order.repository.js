import Order from "./orderModel.js";
import mongoose from "mongoose";
import Review from "../review/Review.js";

class OrderRepository {
  // Create order
  async create(orderData) {
    const order = new Order(orderData);
    return await order.save();
  }

  // Find by ID with optional population
  async findById(orderId, populate = false) {
    let query = Order.findById(orderId);
    
    if (populate) {
      query = query
        .populate('user', 'name email phone')
        .populate('createdBy', 'name');
    }
    
    return await query;
  }

  // Find by Stripe session ID
  async findByStripeSessionId(sessionId, populate = false) {
    let query = Order.findOne({ stripeSessionId: sessionId });
    
    if (populate) {
      query = query
        .populate('user', 'name email phone')
        .populate('createdBy', 'name');
    }
    
    return await query;
  }

  // Find by user ID (works for both guest and registered)
  async findByUserId(userId, populate = false) {
    // Build the $or filter conditionally so we don't accidentally
    // match { user: null } when the provided id is not a valid ObjectId.
    const orConditions = [ { customerId: userId } ];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      orConditions.push({ user: new mongoose.Types.ObjectId(userId) });
    }

    let query = Order.find({ $or: orConditions }).sort({ createdAt: -1 });

    if (populate) {
      query = query.populate('user', 'name email phone');
    }

    return await query;
  }

  // Find order by Stripe payment intent id
  async findByStripePaymentIntent(paymentIntent, populate = false) {
    let query = Order.findOne({ stripePaymentIntent: paymentIntent });
    if (populate) {
      query = query
        .populate('user', 'name email phone')
        .populate('createdBy', 'name');
    }
    return await query;
  }

  // Find by cart ID
  async findByCartId(cartId) {
    return await Order.findOne({ cartId });
  }

  // Find active orders
  async findActiveOrders() {
    return await Order.find({
      status: { $in: ["pending", "confirmed", "preparing", "ready"] }
    })
    .sort({ createdAt: 1 })
    .populate('user', 'name email phone')
    .populate('createdBy', 'name');
  }

  // Get all orders with pagination
  async getAllOrders({ page = 1, limit = 50, status } = {}) {
    const skip = (page - 1) * limit;
    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone')
        .populate('createdBy', 'name'),
      Order.countDocuments(filter)
    ]);

    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // Update order
  async update(orderId, updates) {
    return await Order.findByIdAndUpdate(
        orderId,
      { $set: updates },
      { new: true, runValidators: true }
    );
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
            { $match: { user: { $exists: true, $ne: null } } },
            { $group: { _id: "$user" } },
            { $count: "customersCount" }
          ]
        }
      }
    ];
    const [res] = await Order.aggregate(pipeline);
    const totals = (res?.totals?.[0]) || { totalRevenue: 0, orderCount: 0 };
    const statusCounts = res?.statusCounts || [];
    const customersCount = res?.customers?.[0]?.customersCount || 0;

    // Average rating from approved reviews within the same date range
    const reviewMatch = { status: "approved" };
    if (from || to) {
      reviewMatch.createdAt = {};
      if (from) reviewMatch.createdAt.$gte = new Date(from);
      if (to) reviewMatch.createdAt.$lte = new Date(to);
    }
    const ratingAgg = await Review.aggregate([
      { $match: reviewMatch },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, reviewsCount: { $sum: 1 } } }
    ]);
    const avgRating = Number(ratingAgg?.[0]?.avgRating || 0);

    return { ...totals, statusCounts, customersCount, avgRating };
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
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  // Update status
  async updateStatus(orderId, status) {
    return await Order.findByIdAndUpdate(
      orderId,
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
  }

  // Update payment with user population
  async updatePaymentWithUser(orderId, updates) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true }
    ).populate('user', 'name email phone');
    
    return order;
  }

  // Update payment
  async updatePayment(orderId, updates, session = null) {
    const options = { new: true };
    if (session) options.session = session;
    
    return await Order.findByIdAndUpdate(
      orderId,
      { $set: updates },
      options
    );
  }

  // Cancel order
  async cancelOrder(orderId) {
    return await Order.findByIdAndUpdate(
      orderId,
      { 
        $set: { 
          status: "cancelled",
          updatedAt: new Date()
        }
      },
      { new: true }
    );
  }

  // Update customer info
  async updateCustomerInfo(orderId, customerInfo) {
    return await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          "customerInfo": customerInfo,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
  }

  // Update user ID (link guest to registered user)
  async updateUserId(orderId, userId) {
    return await Order.findByIdAndUpdate(
      orderId,
      { 
        $set: { 
          user: userId,
          customerId: userId.toString(),
          customerType: "registered",
          updatedAt: new Date()
        }
      },
      { new: true }
    );
  }

  // Search orders
  async search(filter = {}, options = {}) {
    const { page = 1, limit = 50, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone'),
      Order.countDocuments(filter)
    ]);

    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // Delete order
  async delete(orderId) {
    return await Order.findByIdAndDelete(orderId);
  }

  // Find by order number
  async findByOrderNumber(orderNumber) {
    return await Order.findOne({ orderNumber })
      .populate('user', 'name email phone');
  }
}

export default new OrderRepository();
