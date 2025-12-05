import Order from "../order.module/orderModel.js";
import mongoose from "mongoose";

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