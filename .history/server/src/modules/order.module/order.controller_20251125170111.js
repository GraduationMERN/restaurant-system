import orderService from "./order.service.js";

// CREATE ORDER FROM CART
export const createOrderFromCart = async (req, res) => {
  try {
    const { cart, productDetails, orderData } = req.body;
    
    const order = await orderService.createOrderFromCart(cart, productDetails, orderData);
    
    res.status(201).json({ 
      success: true, 
      message: "Order created successfully",
      data: order 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// CREATE DIRECT ORDER
export const createDirectOrder = async (req, res) => {
  try {
    const order = await orderService.createDirectOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET ORDER DETAILS
export const getOrder = async (req, res) => {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByUser(req.params.userId);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET ORDER BY CART ID
export const getOrderByCartId = async (req, res) => {
  try {
    const order = await orderService.getOrderByCartId(req.params.cartId);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// GET ACTIVE ORDERS (KITCHEN)
export const getActiveOrders = async (req, res) => {
  try {
    const orders = await orderService.getActiveOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.orderStatus);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
  try {
    const order = await orderService.updatePayment(
      req.params.id, 
      req.body.paymentStatus, 
      req.body.paymentMethod
    );
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE CUSTOMER INFO
export const updateCustomerInfo = async (req, res) => {
  try {
    const order = await orderService.updateCustomerInfo(req.params.id, req.body.customerInfo);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// LINK USER TO ORDER (GUEST REGISTRATION)
export const linkUserToOrder = async (req, res) => {
  try {
    const order = await orderService.linkUserToOrder(req.params.id, req.body.userId);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// SEARCH ORDERS
export const searchOrders = async (req, res) => {
  try {
    const orders = await orderService.searchOrders(req.body.filter, req.body.options);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  try {
    const order = await orderService.deleteOrder(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};