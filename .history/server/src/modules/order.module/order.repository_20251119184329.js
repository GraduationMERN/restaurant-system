// repositories/orderRepository.js
import Order from "../orderModel.js";

class OrderRepository {
  
  // ==============================
  // 1) Create New Order
  // ==============================
  async create(orderData, session = null) {
    const options = session ? { session } : {};
    const order = await Order.create([orderData], options);
    return order[0]; // create returns an array when session used
  }

  // ==============================
  // 2) Find Order by ID
  // ==============================
  async findById(orderId, { populate = [], lean = true } = {}) {
    let query = Order.findById(orderId);

    populate.forEach((p) => (query = query.populate(p)));

    if (lean) query = query.lean();

    return query.exec();
  }

  // ==============================
  // 3) List Orders for Restaurant
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

  // ==============================
  // 4) List Orders for Customer
  // ==============================
  async listByCustomer(customerId, { limit = 50, skip = 0 } = {}) {
    return Order.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  // ==============================
  // 5) Update Order Status
  // ==============================
  async updateStatus(orderId, newStatus) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: newStatus } },
      { new: true }
    ).exec();
  }

  // ==============================
  // 6) Update Payment Status
  // ==============================
  async updatePayment(orderId, paymentStatus, paymentMethod = null) {
    const updateObj = { paymentStatus };
    if (paymentMethod) updateObj.paymentMethod = paymentMethod;

    return Order.findByIdAndUpdate(
      orderId,
      { $set: updateObj },
      { new: true }
    ).exec();
  }

  // ==============================
  // 7) Add Item to Existing Order
  // ==============================
  async addItem(orderId, item) {
    return Order.findByIdAndUpdate(
      orderId,
      { $push: { items: item } },
      { new: true }
    ).exec();
  }

  // ==============================
  // 8) Change Total Amount
  // ==============================
  async updateTotal(orderId, totalAmount) {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { totalAmount } },
      { new: true }
    ).exec();
  }

  // ==============================
  // 9) General filter
  // ==============================
  async search(filter = {}, { skip = 0, limit = 50 } = {}) {
    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  // ==============================
  // 10) Delete Order
  // ==============================
  async delete(orderId) {
    return Order.findByIdAndDelete(orderId).exec();
  }
}

export default new OrderRepository();
