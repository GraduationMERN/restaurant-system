import orderService from "./order.service.js";

// 1) Create Order
export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    // service layer should handle subtotal, tax, tip, deliveryFee, discount, totalAmount calculation
    const order = await orderService.createOrder(orderData);
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
    const updated = await orderService.updateStatus(req.params.id, req.body.orderStatus);
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
      req.body.stripeSessionId,
      req.body.stripeCheckoutSessionId
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

// 6) Update Pricing Breakdown (subtotal, tax, tip, deliveryFee, discount, totalAmount, couponCode)
export const updatePricing = async (req, res) => {
  try {
    const {
      subtotal,
      tax,
      tip,
      deliveryFee,
      discount,
      totalAmount,
      couponCode
    } = req.body;

    const updated = await orderService.updatePricing(req.params.id, {
      subtotal,
      tax,
      tip,
      deliveryFee,
      discount,
      totalAmount,
      couponCode
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 7) Get Orders for Restaurant
export const getOrdersForRestaurant = async (req, res) => {
  try {
    const { status, isRewardOrder } = req.query;
    const orders = await orderService.getOrdersForRestaurant(req.params.restaurantId, {
      status,
      isRewardOrder: isRewardOrder === "true" ? true : isRewardOrder === "false" ? false : undefined
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 8) Get Orders for Customer
export const getOrdersForCustomer = async (req, res) => {
  try {
    const { isRewardOrder } = req.query;
    const orders = await orderService.getOrdersForCustomer(req.params.customerId, {
      isRewardOrder: isRewardOrder === "true" ? true : isRewardOrder === "false" ? false : undefined
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 9) Add Item to Existing Order
export const addItemToOrder = async (req, res) => {
  try {
    const updated = await orderService.addItem(req.params.id, req.body.item);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 10) Update Table Number
export const updateTableNumber = async (req, res) => {
  try {
    const updated = await orderService.updateTable(req.params.id, req.body.tableNumber);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 11) Update Service Type
export const updateServiceType = async (req, res) => {
  try {
    const updated = await orderService.updateServiceType(req.params.id, req.body.serviceType);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
