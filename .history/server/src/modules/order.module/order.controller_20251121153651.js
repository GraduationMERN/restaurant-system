import orderService from "./order.service.js";

export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================
// GET ORDER BY ID
// ============================
export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// ============================
// UPDATE ORDER STATUS
// ============================
export const updateOrderStatus = async (req, res) => {
  try {
    const updated = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================
// UPDATE PAYMENT
// ============================
export const updatePaymentStatus = async (req, res) => {
  try {
    const updated = await orderService.updatePayment(
      req.params.id,
      req.body.paymentStatus,
      req.body.paymentMethod
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================
// LIST ORDERS FOR RESTAURANT
// ============================
// مثال: create order
const orderData = {
  customerId: req.body.customerId,
  restaurantId: req.body.restaurantId,
  items: req.body.items,
  isRewardOrder: req.body.isRewardOrder || false
};
const order = await orderService.createOrder(orderData);

export const getOrdersForRestaurant = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForRestaurant(req.params.restaurantId);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================
// LIST ORDERS FOR CUSTOMER
// ============================
export const getOrdersForCustomer = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForCustomer(req.params.customerId);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
