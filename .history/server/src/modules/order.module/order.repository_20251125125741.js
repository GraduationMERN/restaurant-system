import Order from "./orderModel.js";

class OrderRepository {
  async create(orderData, session = null) {
    if (session) {
      const order = await Order.create([orderData], { session });
      return order[0];
    }
    return Order.create(orderData);
  }

  async findById(orderId, { populate = [], lean = true } = {}) {
    let query = Order.findById(orderId);
    populate.forEach((p) => (query = query.populate(p)));
    if (lean) query = query.lean();
    return query.exec();
  }

  async listByUser(userId, { status, limit = 50, skip = 0 } = {}) {
    const filter = { userId };
    if (status) filter.orderStatus = status;
    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async listByStatus(status, { limit = 50, skip = 0 } = {}) {
    return Order.find({ orderStatus: status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async updateStatus(orderId, newStatus) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: newStatus } },
      { new: true }
    ).exec();
  }

  async updatePayment(orderId, paymentStatus, paymentMethod = null) {
    const update = { paymentStatus };
    if (paymentMethod) update.paymentMethod = paymentMethod;
    return Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).exec();
  }

  async updateCustomerInfo(orderId, customerInfo) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { customerInfo } },
      { new: true }
    ).exec();
  }

  async linkUserToOrder(orderId, userId) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { userId } },
      { new: true }
    ).exec();
  }

  async addItem(orderId, item) {
    return Order.findByIdAndUpdate(
      orderId,
      { $push: { items: item } },
      { new: true }
    ).exec();
  }

  async updateItems(orderId, items) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { items } },
      { new: true }
    ).exec();
  }

  async updatePricing(orderId, { subtotal, tax, deliveryFee, discount, totalAmount }) {
    const update = { subtotal, tax, deliveryFee, discount, totalAmount };
    return Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).exec();
  }

  async updateTable(orderId, tableNumber) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { tableNumber } },
      { new: true }
    ).exec();
  }

  async updateServiceType(orderId, serviceType) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { serviceType } },
      { new: true }
    ).exec();
  }

  async updateNotes(orderId, notes) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { notes } },
      { new: true }
    ).exec();
  }

  async findByCartId(cartId) {
    return Order.find({ cartId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async search(filter = {}, { skip = 0, limit = 50 } = {}) {
    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async delete(orderId) {
    return Order.findByIdAndDelete(orderId).exec();
  }

  async getTodaysOrders() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return Order.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  }

  async listByPaymentStatus(paymentStatus, { limit = 50, skip = 0 } = {}) {
    return Order.find({ paymentStatus })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }
}

export default new OrderRepository();