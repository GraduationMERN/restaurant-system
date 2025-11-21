// repositories/orderRepository.js
import Order from "./orderModel.js";

class OrderRepository {
  // ==============================
  // 1) Create Order
  // ==============================
  async create(orderData, session = null) {
    if (session) {
      const order = await Order.create([orderData], { session });
      return order[0];
    }
    return Order.create(orderData);
  }

  // ==============================
  // 2) Find by ID
  // ==============================
  async findById(orderId, { populate = [], lean = true } = {}) {
    let query = Order.findById(orderId);

    populate.forEach((p) => (query = query.populate(p)));

    if (lean) query = query.lean();

    return query.exec();
  }

  // ==============================
  // 3) Orders by Restaurant
  // ==============================
  async listByRestaurant(restaurantId, { status, limit = 50, skip = 0 } = {}) {
    const filter = { restaurantId };
    if (status) filter.orderStatus = status;

    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }
  // 4) Orders by Customer
  async listByCustomer(customerId, { limit = 50, skip = 0 } = {}) {
    return Order.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }
  // 5) Update Order Status
  async updateStatus(orderId, newStatus) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: newStatus } },
      { new: true }
    ).exec();
  }
  // 6) Update Payment Status
  async updatePayment(orderId, paymentStatus, paymentMethod = null) {
    const update = { paymentStatus };
    if (paymentMethod) update.paymentMethod = paymentMethod;

    return Order.findByIdAndUpdate(
      orderId,
      { $set: update },
      { new: true }
    ).exec();
  }
  //Update Reward Points
  async updateRewardPoints(orderId, rewardPoints) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { rewardPointsEarned: rewardPoints } },
      { new: true }
    ).exec();
  }

  // 7) Add Item to Order
    async addItem(orderId, item) {
    return Order.findByIdAndUpdate(
      orderId,
      { $push: { items: item } },
      { new: true }
    ).exec();
  }

  //  Replace All Items

  async updateItems(orderId, items) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { items } },
      { new: true }
    ).exec();
  }
  // 8) Total
  async updateTotal(orderId, totalAmount) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { totalAmount } },
      { new: true }
    ).exec();
  }
  //  Table Number
  async updateTable(orderId, tableNumber) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { tableNumber } },
      { new: true }
    ).exec();
  }
  // Service Type
  async updateServiceType(orderId, serviceType) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { serviceType } },
      { new: true }
    ).exec();
  }

  // 9) Search Orders
  async search(filter = {}, { skip = 0, limit = 50 } = {}) {
    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }
  // 10) Delete Order
  async delete(orderId) {
    return Order.findByIdAndDelete(orderId).exec();
  }
}

export default new OrderRepository();
