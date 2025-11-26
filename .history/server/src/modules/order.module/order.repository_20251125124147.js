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

  // 3) List Orders by User (replaces listByRestaurant)
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

  // 4) List Orders by Status (for kitchen/management)
  async listByStatus(status, { limit = 50, skip = 0 } = {}) {
    return Order.find({ orderStatus: status })
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

  // 6) Update Payment (status + method)
  async updatePayment(
    orderId,
    paymentStatus,
    paymentMethod = null
  ) {
    const update = { paymentStatus };
    if (paymentMethod) update.paymentMethod = paymentMethod;

    return Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).exec();
  }

  // 7) Update Customer Info (for guest registration)
  async updateCustomerInfo(orderId, customerInfo) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { customerInfo } },
      { new: true }
    ).exec();
  }

  // 8) Link User to Order (after registration)
  async linkUserToOrder(orderId, userId) {
    return Order.findByIdAndUpdate(
      orderId,
      { 
        $set: { 
          userId: userId,
          registeredDuringCheckout: true 
        } 
      },
      { new: true }
    ).exec();
  }

  // 9) Add Item to Existing Order
  async addItem(orderId, item) {
    return Order.findByIdAndUpdate(
      orderId,
      { $push: { items: item } },
      { new: true }
    ).exec();
  }

  // 10) Replace All Items
  async updateItems(orderId, items) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { items } },
      { new: true }
    ).exec();
  }

  // 11) Update Pricing (subtotal, tax, deliveryFee, discount, totalAmount)
  async updatePricing(
    orderId,
    { subtotal, tax, deliveryFee, discount, totalAmount }
  ) {
    const update = { subtotal, tax, deliveryFee, discount, totalAmount };

    return Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).exec();
  }

  // 12) Update Table Number
  async updateTable(orderId, tableNumber) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { tableNumber } },
      { new: true }
    ).exec();
  }

  // 13) Update Service Type
  async updateServiceType(orderId, serviceType) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { serviceType } },
      { new: true }
    ).exec();
  }

  // 14) Update Order Notes
  async updateNotes(orderId, notes) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { notes } },
      { new: true }
    ).exec();
  }

  // 15) Find Orders by Cart ID
  async findByCartId(cartId) {
    return Order.find({ cartId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  // 16) Find Guest Orders by Session ID
  async findBySessionId(sessionId, { limit = 50, skip = 0 } = {}) {
    return Order.find({ userId: sessionId }) // userId stores session ID for guests
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  // 17) Search Orders (filter + pagination)
  async search(filter = {}, { skip = 0, limit = 50 } = {}) {
    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  // 18) Delete Order
  async delete(orderId) {
    return Order.findByIdAndDelete(orderId).exec();
  }

  // 19) Get Today's Orders (for dashboard)
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

  // 20) Get Orders by Payment Status
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