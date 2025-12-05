// import Order from "./orderModel.js";


// class OrderRepository {
//   // ==============================
//   // CREATE
//   // ==============================
//   async create(orderData) {
//     return Order.create(orderData);
//   }

//   // ==============================
//   // READ
//   // ==============================
//   async findById(orderId, populateProducts = false) {
//     let query = Order.findById(orderId);
//     if (populateProducts) {
//       query = query
//         .populate("items.productId")
//         .populate("userId", "name email phone")
//         .populate("cartId");
//     }
//     return query.exec();
//   }

//   async findByUserId(userId) {
//     return Order.find({ userId })
//       .populate("items.productId")
//       .populate("cartId")
//       .sort({ createdAt: -1 })
//       .exec();
//   }

//   async findByCartId(cartId) {
//     return Order.findOne({ cartId })
//       .populate("items.productId")
//       .populate("userId", "name email phone")
//       .exec();
//   }

//   async findActiveOrders() {
//     return Order.find({ status: { $in: ["pending", "confirmed", "preparing"] } })
//       .populate("items.productId")
//       .populate("userId", "name email phone")
//       .sort({ createdAt: 1 })
//       .exec();
//   }

//   async findByStatus(status) {
//     return Order.find({ status })
//       .populate("items.productId")
//       .populate("userId", "name email phone")
//       .sort({ createdAt: -1 })
//       .exec();
//   }

//   async getAllOrders() {
//     return Order.find()
//       .populate("items.productId")
//       .populate("userId", "name email phone")
//       .sort({ createdAt: -1 })
//       .exec();
//   }

//   // ==============================
//   // UPDATE
//   // ==============================
//   async updateStatus(orderId, newStatus) {
//     return Order.findByIdAndUpdate(
//       orderId,
//       { status: newStatus, updatedAt: new Date() },
//       { new: true }
//     )
//     .populate("items.productId")
//     .populate("userId", "name email phone");
//   }

//   async updatePayment(orderId, updates) {
//     return Order.findByIdAndUpdate(
//       orderId,
//       { ...updates, updatedAt: new Date() },
//       { new: true }
//     )
//     .populate("items.productId")
//     .populate("userId", "name email phone");
//   }

//   async updateCustomerInfo(orderId, customerInfo) {
//     return Order.findByIdAndUpdate(
//       orderId,
//       { customerInfo, updatedAt: new Date() },
//       { new: true }
//     )
//     .populate("items.productId")
//     .populate("userId", "name email phone");
//   }

//   async updateUserId(orderId, newUserId) {
//     return Order.findByIdAndUpdate(
//       orderId,
//       { userId: newUserId, updatedAt: new Date() },
//       { new: true }
//     )
//     .populate("items.productId")
//     .populate("userId", "name email phone");
//   }

//   async update(orderId, updates) {
//     return Order.findByIdAndUpdate(
//       orderId,
//       { ...updates, updatedAt: new Date() },
//       { new: true }
//     )
//     .populate("items.productId")
//     .populate("userId", "name email phone");
//   }

//   async cancelOrder(orderId) {
//     return Order.findByIdAndUpdate(
//       orderId,
//       { status: "cancelled", updatedAt: new Date() },
//       { new: true }
//     )
//     .populate("items.productId")
//     .populate("userId", "name email phone");
//   }

//   // ==============================
//   // DELETE
//   // ==============================
//   async delete(orderId) {
//     return Order.findByIdAndDelete(orderId);
//   }

//   // ==============================
//   // SEARCH / FILTER / PAGINATION
//   // ==============================
//   async search(filter = {}, options = {}) {
//     const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
//     return Order.find(filter)
//       .populate("items.productId")
//       .populate("userId", "name email phone")
//       .sort(sort)
//       .skip(skip)
//       .limit(limit)
//       .exec();
//   }

//   async findByDateRange(startDate, endDate) {
//     return Order.find({
//       createdAt: { $gte: startDate, $lte: endDate }
//     })
//     .populate("items.productId")
//     .populate("userId", "name email phone")
//     .sort({ createdAt: -1 })
//     .exec();
//   }

//   // ==============================
//   // STATISTICS
//   // ==============================
//   async getOrderStats() {
//     return Order.aggregate([
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//           totalRevenue: { $sum: "$totalAmount" }
//         }
//       }
//     ]);
//   }

//   // ==============================
//   // NEW FUNCTIONS FOR PAYMENT SERVICE
//   // ==============================

//   /**
//    * Update Stripe Session ID (supports optional transaction)
//    */
//   async updateStripeSessionId(orderId, sessionId, opts = {}) {
//     return Order.findByIdAndUpdate(
//       orderId,
//       { stripeSessionId: sessionId },
//       { new: true, ...(opts.session && { session: opts.session }) }
//     );
//   }

//   /**
//    * Create a Payment Log for auditing
//    */
//   // async createPaymentLog(orderId, payload, opts = {}) {
//   //   if (!PaymentLog) return null; // optional
//   //   return PaymentLog.create([{ orderId, ...payload }], {
//   //     ...(opts.session && { session: opts.session })
//   //   });
//   // }
// }

// export default new OrderRepository();
 // order.repository.js - الملف المصحح
import Order from "./orderModel.js";
import User from "../user/model/User.js"; // استورد User model

class OrderRepository {
  // ==============================
  // CREATE
  // ==============================
  async create(orderData) {
    return Order.create(orderData);
  }

  // ==============================
  // READ - تم التصحيح
  // ==============================
  async findById(orderId, populateProducts = false) {
    let query = Order.findById(orderId);
    if (populateProducts) {
      query = query
        .populate("items.productId") // ✅ هذا يعمل (productId هو ObjectId)
        // .populate("userId", "name email phone") // ❌ أزل هذا - userId هو String
        .populate("cartId"); // ✅ هذا يعمل (cartId هو ObjectId)
    }
    return query.exec();
  }

  async findByUserId(userId) {
    // البحث بالمستخدم
    return Order.find({ userId })
      .populate("items.productId")
      // .populate("cartId") // ✅ يعمل إذا كان cartId هو ObjectId
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCartId(cartId) {
    return Order.findOne({ cartId })
      .populate("items.productId")
      // .populate("userId", "name email phone") // ❌ أزل
      .exec();
  }

  async findActiveOrders() {
    return Order.find({ status: { $in: ["pending", "confirmed", "preparing"] } })
      .populate("items.productId")
      // .populate("userId", "name email phone") // ❌ أزل
      .sort({ createdAt: 1 })
      .exec();
  }

  async findByStatus(status) {
    return Order.find({ status })
      .populate("items.productId")
      // .populate("userId", "name email phone") // ❌ أزل
      .sort({ createdAt: -1 })
      .exec();
  }

  // Find order by human-friendly order number
  async findByOrderNumber(orderNumber) {
    return Order.findOne({ orderNumber })
      .populate("items.productId")
      .exec();
  }

  async getAllOrders() {
    return Order.find()
      .populate("items.productId")
      // .populate("userId", "name email phone") // ❌ أزل
      .sort({ createdAt: -1 })
      .exec();
  }

  // ==============================
  // UPDATE - تم التصحيح
  // ==============================
  async updateStatus(orderId, newStatus) {
    return Order.findByIdAndUpdate(
      orderId,
      { status: newStatus, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId"); // ❌ أزل populate userId
  }

  async updatePayment(orderId, updates) {
    return Order.findByIdAndUpdate(
      orderId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId"); // ❌ أزل populate userId
  }

  async updateCustomerInfo(orderId, customerInfo) {
    return Order.findByIdAndUpdate(
      orderId,
      { customerInfo, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId"); // ❌ أزل populate userId
  }

  async updateUserId(orderId, newUserId) {
    return Order.findByIdAndUpdate(
      orderId,
      { userId: newUserId, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId"); // ❌ أزل populate userId
  }

  async update(orderId, updates) {
    return Order.findByIdAndUpdate(
      orderId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId"); // ❌ أزل populate userId
  }

  async cancelOrder(orderId) {
    return Order.findByIdAndUpdate(
      orderId,
      { status: "cancelled", updatedAt: new Date() },
      { new: true }
    )
    .populate("items.productId"); // ❌ أزل populate userId
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
      // .populate("userId", "name email phone") // ❌ أزل
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
    // .populate("userId", "name email phone") // ❌ أزل
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

  async updateStripeSessionId(orderId, sessionId, opts = {}) {
    return Order.findByIdAndUpdate(
      orderId,
      { stripeSessionId: sessionId },
      { new: true, ...(opts.session && { session: opts.session }) }
    );
  }

  // ==============================
  // NEW: دالة للحصول على بيانات المستخدم يدوياً
  // ==============================
  
  /**
   * الحصول على بيانات المستخدم يدوياً (بدون populate)
   */
  async getUserForOrder(order) {
    if (!order || !order.userId) return null;
    
    try {
      let user = null;
      
      // تحقق إذا كان userId هو ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(order.userId)) {
        user = await User.findById(order.userId).select('name email phone');
      } 
      // أو إذا كان UUID
      else if (order.userId.includes('-')) {
        user = await User.findOne({ uuid: order.userId }).select('name email phone');
      }
      
      return user;
    } catch (error) {
      console.error("Error getting user for order:", error);
      return null;
    }
  }
  
  /**
   * دالة مدمجة: تجلب الـ order مع بيانات المستخدم
   */
  async findByIdWithUser(orderId) {
    const order = await Order.findById(orderId).populate("items.productId");
    if (order) {
      const user = await this.getUserForOrder(order);
      order._doc.user = user; // أضف بيانات المستخدم
    }
    return order;
  }
  
  /**
   * دالة مدمجة: تحديث مع إرجاع بيانات المستخدم
   */
  async updatePaymentWithUser(orderId, updates) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).populate("items.productId");
    
    if (order) {
      const user = await this.getUserForOrder(order);
      order._doc.user = user;
    }
    
    return order;
  }

  // Find an order by its Stripe Checkout Session ID
  async findByStripeSessionId(sessionId) {
    return Order.findOne({ stripeSessionId: sessionId })
      .populate("items.productId")
      .exec();
  }

}

export default new OrderRepository();