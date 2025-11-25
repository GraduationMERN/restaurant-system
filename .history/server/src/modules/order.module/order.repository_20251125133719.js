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
      orderId,
      { orderStatus: newStatus },
      { new: true }
    ).populate('items.productId');
  }

  // UPDATE PAYMENT
  async updatePayment(orderId, paymentStatus, paymentMethod) {
    return await Order.findByIdAndUpdate(
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
}

export default new OrderRepository();