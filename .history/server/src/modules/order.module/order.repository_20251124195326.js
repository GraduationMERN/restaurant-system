import Order from "./orderModel.js";

class OrderRepository {
  // 1) Create Order
  async create(orderData, session = null) {
    if (session) {
      const order = await Order.create([orderData], { session });
      return order[0];
    }
    return Order.create(orderData);
  }

  // 2) Find Order by ID
  async findById(orderId, { populate = [], lean = true } = {}) {
    let query = Order.findById(orderId);
    populate.forEach((p) => (query = query.populate(p)));
    if (lean) query = query.lean();
    return query.exec();
  }

  // 3) List Orders by Restaurant
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

  // 4) List Orders by Customer
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

  // 6) Update Payment (status + method + stripeSessionId)
  async updatePayment(
    orderId,
    paymentStatus,
    paymentMethod = null,
    stripeSessionId = null,
    stripeCheckoutSessionId = null
  ) {
    const update = { paymentStatus };
    if (paymentMethod) update.paymentMethod = paymentMethod;
    if (stripeSessionId) update.stripeSessionId = stripeSessionId;
    if (stripeCheckoutSessionId) update.stripeCheckoutSessionId = stripeCheckoutSessionId;

    return Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).exec();
  }

  // 7) Update Reward Points
  async updateRewardPoints(orderId, rewardPoints) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { rewardPointsEarned: rewardPoints } },
      { new: true }
    ).exec();
  }

  // 8) Add Item to Existing Order
  async addItem(orderId, item) {
    return Order.findByIdAndUpdate(
      orderId,
      { $push: { items: item } },
      { new: true }
    ).exec();
  }

  // 9) Replace All Items
  async updateItems(orderId, items) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { items } },
      { new: true }
    ).exec();
  }

  // 10) Update Pricing (subtotal, tax, tip, deliveryFee, discount, totalAmount)
  async updatePricing(
    orderId,
    { subtotal, tax, tip, deliveryFee, discount, totalAmount, couponCode = null }
  ) {
    const update = { subtotal, tax, tip, deliveryFee, discount, totalAmount };
    if (couponCode) update.couponCode = couponCode;

    return Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).exec();
  }

  // 11) Update Table Number
  async updateTable(orderId, tableNumber) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { tableNumber } },
      { new: true }
    ).exec();
  }

  // 12) Update Service Type
  async updateServiceType(orderId, serviceType) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { serviceType } },
      { new: true }
    ).exec();
  }

  // 13) Mark Order as Reward Order
  async markAsRewardOrder(orderId, isReward = true) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { isRewardOrder: isReward } },
      { new: true }
    ).exec();
  }

  // 14) Search Orders (filter + pagination)
  async search(filter = {}, { skip = 0, limit = 50 } = {}) {
    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  // 15) Delete Order
  async delete(orderId) {
    return Order.findByIdAndDelete(orderId).exec();
  }
}

export default new OrderRepository();
