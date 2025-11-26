import Order from "./orderModel.js";

class OrderRepository {
  // CREATE ORDER
  async create(orderData) {
    return await Order.create(orderData);
  }

  // FIND BY ID (with product population)
  async findById(orderId, populateProducts = false) {
    let query = Order.findById(orderId);
    if (populateProducts) {
      query = query.populate('items.productId');
    }
    return query.exec();
  }

  // FIND BY USER ID
  async findByUserId(userId) {
    return await Order.find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  // FIND BY CART ID
  async findByCartId(cartId) {
    return await Order.findOne({ cartId })
      .populate('items.productId')
      .exec();
  }

  // FIND ACTIVE ORDERS (for kitchen)
  async findActiveOrders() {
    return await Order.find({ 
      orderStatus: { $in: ["pending", "preparing", "ready"] } 
    })
    .populate('items.productId')
    .sort({ createdAt: 1 })
    .exec();
  }

  // UPDATE STATUS
  async updateStatus(orderId, newStatus) {
    return await Order.findByIdAndUpdate(
  // ==============================
  // 5) Update Order Status
  // ==============================
  async updateStatus(orderId, newStatus, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: newStatus } },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // ==============================
  // 6) Update Payment (status + method + stripeSessionId)
  // ==============================
  async updatePayment(orderId, paymentStatus, paymentMethod = null, stripeSessionId = null) {
    const update = { paymentStatus };
    if (paymentMethod) update.paymentMethod = paymentMethod;
    if (stripeSessionId) update.stripeSessionId = stripeSessionId;
    return Order.findByIdAndUpdate(
      orderId,
      { $set: update },
      { new: true }
    ).exec();
  }

  // ==============================
  // 7) Update Reward Points
  // ==============================
  async updateRewardPoints(orderId, rewardPoints) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { rewardPointsEarned: rewardPoints } },
      { new: true }
    ).exec();
  }

  // ==============================
  // 8) Add Item to Existing Order
  // ==============================
  async addItem(orderId, item, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $push: { items: item } },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // ==============================
  // 9) Replace All Items
  // ==============================
  async updateItems(orderId, items, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $set: { items } },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // ==============================
  // 10) Update Total Amount
  // ==============================
  async updateTotal(orderId, totalAmount, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { orderStatus: newStatus },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // ==============================
  // 11) Update Table Number
  // ==============================
  async updateTable(orderId, tableNumber, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { 
        paymentStatus,
        paymentMethod 
      },
      { new: true }
    ).populate('items.productId');
  }

  // UPDATE CUSTOMER INFO
  async updateCustomerInfo(orderId, customerInfo) {
    return await Order.findByIdAndUpdate(
      orderId,
      { customerInfo },
      { new: true }
    ).populate('items.productId');
  }

  // UPDATE USER ID (when guest registers)
  async updateUserId(orderId, newUserId) {
    return await Order.findByIdAndUpdate(
      orderId,
      { userId: newUserId },
      { new: true }
    );
  }

  // SEARCH ORDERS WITH FILTERS
  async search(filter = {}, options = {}) {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
    
    return await Order.find(filter)
      .populate('items.productId')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  // DELETE ORDER
  async delete(orderId) {
    return await Order.findByIdAndDelete(orderId);
  }

  async getAllOrders(){
    return Order.find()
  }
}

export default new OrderRepository();