import Order from "./orderModel.js";

class OrderRepository {
  // CREATE ORDER
  async create(orderData) {
    return Order.create(orderData);
  }

  // FIND BY ID (with optional product population)
  async findById(orderId, populateProducts = false) {
    let query = Order.findById(orderId);
    if (populateProducts) query = query.populate('items.productId');
    return query.exec();
  }

  // FIND BY USER ID
  async findByUserId(userId) {
    return Order.find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  // FIND BY CART ID
  async findByCartId(cartId) {
    return Order.findOne({ cartId })
      .populate('items.productId')
      .exec();
  }

  // FIND ACTIVE ORDERS (for kitchen)
  async findActiveOrders() {
    return Order.find({ orderStatus: { $in: ["pending", "preparing", "ready"] } })
      .populate('items.productId')
      .sort({ createdAt: 1 })
      .exec();
  }

  // UPDATE STATUS
  async updateStatus(orderId, newStatus, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: newStatus } },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // UPDATE PAYMENT (status + method + stripeSessionId)
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

  // UPDATE REWARD POINTS
  async updateRewardPoints(orderId, rewardPoints) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { rewardPointsEarned: rewardPoints } },
      { new: true }
    ).exec();
  }

  // ADD ITEM TO EXISTING ORDER
  async addItem(orderId, item, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $push: { items: item } },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // REPLACE ALL ITEMS
  async updateItems(orderId, items, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $set: { items } },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // UPDATE TOTAL AMOUNT
  async updateTotal(orderId, totalAmount, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $set: { totalAmount } },
      { new: true }
    );
    if (session) query = query.session(session);
    return query.exec();
  }

  // UPDATE TABLE NUMBER
  async updateTable(orderId, tableNumber, session = null) {
    let query = Order.findByIdAndUpdate(
      orderId,
      { $set: { tableNumber } },
      { new: true }
    ).populate('items.productId');
    if (session) query = query.session(session);
    return query.exec();
  }

  // UPDATE CUSTOMER INFO
  async updateCustomerInfo(orderId, customerInfo) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { customerInfo } },
      { new: true }
    ).populate('items.productId');
  }

  // UPDATE USER ID (for guest -> registered user)
  async updateUserId(orderId, newUserId) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { userId: newUserId } },
      { new: true }
    );
  }

  // SEARCH ORDERS WITH FILTERS
  async search(filter = {}, options = {}) {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
    return Order.find(filter)
      .populate('items.productId')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  // DELETE ORDER
  async delete(orderId) {
    return Order.findByIdAndDelete(orderId).exec();
  }

  // GET ALL ORDERS
  async getAllOrders() {
    return Order.find().exec();
  }
}

export default new OrderRepository();
