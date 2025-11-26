import orderService from "./order.service.js";

// 1) Create Order
export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
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
      req.body.paymentMethod
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5) Update Customer Info
export const updateCustomerInfo = async (req, res) => {
  try {
    const updated = await orderService.updateCustomerInfo(req.params.id, req.body.customerInfo);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 6) Link User to Order (after registration)
export const linkUserToOrder = async (req, res) => {
  try {
    const updated = await orderService.linkUserToOrder(req.params.id, req.body.userId);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 7) Update Pricing
export const updatePricing = async (req, res) => {
  try {
    const { subtotal, tax, deliveryFee, discount, totalAmount } = req.body;
    const updated = await orderService.updatePricing(req.params.id, {
      subtotal,
      tax,
      deliveryFee,
      discount,
      totalAmount
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 8) Get Orders by User
export const getOrdersByUser = async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await orderService.getOrdersByUser(req.params.userId, { status });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 9) Get Orders by Status
export const getOrdersByStatus = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByStatus(req.params.status);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 10) Add Item to Order
export const addItemToOrder = async (req, res) => {
  try {
    const updated = await orderService.addItem(req.params.id, req.body.item);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 11) Update Table Number
export const updateTableNumber = async (req, res) => {
  try {
    const updated = await orderService.updateTable(req.params.id, req.body.tableNumber);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 12) Update Service Type
export const updateServiceType = async (req, res) => {
  try {
    const updated = await orderService.updateServiceType(req.params.id, req.body.serviceType);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 13) Get Today's Orders
export const getTodaysOrders = async (req, res) => {
  try {
    const orders = await orderService.getTodaysOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};