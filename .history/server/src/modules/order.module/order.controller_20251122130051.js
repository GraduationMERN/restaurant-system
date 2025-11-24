import orderService from "./order.service.js";
// 1) Create Order
export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
// 2) Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};
// 3) Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const updated = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 4) Update Payment Status
export const updatePaymentStatus = async (req, res) => {
  try {
    const updated = await orderService.updatePayment(
      req.params.id,
      req.body.paymentStatus,
      req.body.paymentMethod,
      req.body.stripeSessionId 
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5) Update Reward Points (admin / system use)
export const updateRewardPoints = async (req, res) => {
  try {
    const updated = await orderService.updateRewardPoints(
      req.params.id,
      req.body.rewardPoints
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// 6) Get Orders for Restaurant
// ==============================
export const getOrdersForRestaurant = async (req, res) => {
  try {
    const { status, isRewardOrder } = req.query; // فلترة اختياري
    const orders = await orderService.getOrdersForRestaurant(req.params.restaurantId, {
      status,
      isRewardOrder: isRewardOrder === "true" ? true : isRewardOrder === "false" ? false : undefined
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// 7) Get Orders for Customer
// ==============================
export const getOrdersForCustomer = async (req, res) => {
  try {
    const { isRewardOrder } = req.query; // فلترة اختياري
    const orders = await orderService.getOrdersForCustomer(req.params.customerId, {
      isRewardOrder: isRewardOrder === "true" ? true : isRewardOrder === "false" ? false : undefined
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
