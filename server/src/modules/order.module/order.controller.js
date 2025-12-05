import orderService from "./order.service.js";
import PaymentService from "../payment/paymentService.js";
import Order from "../order.module/orderModel.js";
// Avoid importing server.js here to prevent circular imports.
// Use `global.io` and `global.notificationService` which are set in `server.js` after initialization.

// ==============================
// CREATE ORDER FROM CART (SIMPLIFIED)
// ==============================
export const createOrderFromCart = async (req, res) => {
  try {
    const { 
      cartId, 
      serviceType,
      tableNumber,
      notes,
      paymentMethod = "online", // Default for online orders
      customerInfo,
      deliveryLocation
    } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "cartId is required"
      });
    }

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: "serviceType is required"
      });
    }

    // Get user info from middleware
    const user = req.user;
    
    const orderData = {
      cartId,
      serviceType,
      tableNumber,
      notes,
      paymentMethod,
      customerInfo,
      deliveryLocation,
      // Pass user info based on authentication
      customerId: user?._id?.toString() || null,
      isGuest: user?.isGuest || false,
      customerType: user?.isGuest ? "guest" : "registered",
      user: user?.isGuest ? null : user?._id
    };

    const order = await orderService.createOrderFromCart(orderData);

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .lean();

    // Add customer info for guest users
    if (!populatedOrder.user && populatedOrder.customerId && user?.isGuest) {
      populatedOrder.user = {
        _id: populatedOrder.customerId,
        name: populatedOrder.customerInfo?.name || "Guest",
        email: populatedOrder.customerInfo?.email || "",
        phone: populatedOrder.customerInfo?.phone || ""
      };
    }

    // Notifications (use global service set in server.js)
    if (global.notificationService) {
      await global.notificationService.sendToRole("cashier", {
        title: "New Order",
        message: `New ${serviceType} order from ${populatedOrder.customerInfo?.name || "Guest"}`,
        orderId: populatedOrder._id,
        orderNumber: populatedOrder.orderNumber
      });
    }

    // Socket events (use global.io to avoid circular import)
    if (global.io) {
      // Emit to specific rooms
      global.io.to("cashier").emit("order:new", populatedOrder);
      global.io.to("kitchen").emit("order:new", populatedOrder);

      // Emit to customer if they're online (standardize on `user:<id>` room)
      if (populatedOrder.customerId) {
        global.io.to(`user:${populatedOrder.customerId}`).emit("order:created", populatedOrder);
      }
    }

    res.status(201).json({ 
      success: true, 
      data: populatedOrder
    });
  } catch (err) {
    console.error("Create order from cart error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// CREATE DIRECT ORDER (CASHIER)
// ==============================
export const createDirectOrder = async (req, res) => {
  try {
    const {
      items,
      serviceType,
      tableNumber,
      customerInfo,
      paymentMethod = "cash",
      notes,
      estimatedTime = 25
    } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty"
      });
    }

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: "serviceType is required"
      });
    }

    if (serviceType === "dine-in" && !tableNumber) {
      return res.status(400).json({
        success: false,
        message: "tableNumber is required for dine-in orders"
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.15; // 15% VAT example
    const totalAmount = subtotal + vat;

    // Create guest customer ID for walk-in
    const guestId = `walkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const orderData = {
      items,
      serviceType,
      tableNumber,
      customerInfo: {
        name: customerInfo?.name || "Walk-in Customer",
        phone: customerInfo?.phone || "",
        email: customerInfo?.email || ""
      },
      paymentMethod,
      paymentStatus: "paid", // Direct orders are paid immediately
      subtotal,
      vat,
      totalAmount,
      notes,
      estimatedTime,
      customerId: guestId,
      customerType: "guest",
      isDirectOrder: true,
      createdBy: req.user?._id, // Cashier who created
      status: "confirmed" // Skip pending for direct orders
    };

    const order = await Order.create(orderData);

    // Socket events (use global.io)
    if (global.io) {
      global.io.to("kitchen").emit("order:new", order);
      global.io.to("cashier").emit("order:direct", order);
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error("Create direct order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// GET USER ORDERS
// ==============================
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // If user is requesting their own orders
    if (user && (user._id?.toString() === userId || user.customerId === userId)) {
      const requesterId = user._id?.toString() || user.customerId;
      const orders = await Order.find({ customerId: requesterId })
        .sort({ createdAt: -1 })
        .populate('user', 'name email')
        .lean();

      return res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    }

    // For guest users, they can only see orders with their guest ID
    if (user?.isGuest && user._id?.toString() === userId) {
      const orders = await Order.find({ customerId: userId, customerType: "guest" })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    }

    // Admin/Cashier viewing other users
    if (user?.role === "admin" || user?.role === "cashier") {
      const orders = await Order.find({ 
        $or: [
          { customerId: userId },
          { user: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();

      return res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    }

    res.status(403).json({
      success: false,
      message: "Not authorized to view these orders"
    });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// UPDATE ORDER STATUS
// ==============================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedTime } = req.body;
    const user = req.user;

    // Validate status
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update status
    order.status = status;
    
    // Update estimated time if provided
    if (estimatedTime) {
      order.estimatedTime = estimatedTime;
      order.estimatedReadyTime = new Date(Date.now() + estimatedTime * 60000);
    }

    await order.save();

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('createdBy', 'name')
      .lean();

    // Socket events (use global.io)
    if (global.io) {
      // General update for all listeners
      global.io.emit("order:status-changed", {
        orderId: order._id,
        status: order.status,
        orderNumber: order.orderNumber,
        estimatedReadyTime: order.estimatedReadyTime,
        updatedBy: user?.name || "System"
      });

      // Room-specific events
      if (["preparing", "ready"].includes(status)) {
        global.io.to("kitchen").emit("order:kitchen-update", populatedOrder);
      }

      if (status === "ready") {
        global.io.to("cashier").emit("order:ready-notification", populatedOrder);
      }

      // Customer notification (standardize to `user:<id>`)
      if (order.customerId) {
        global.io.to(`user:${order.customerId}`).emit("order:your-status-changed", {
          orderId: order._id,
          status: order.status,
          estimatedTime: order.estimatedTime
        });
      }
    }

    res.json({
      success: true,
      data: populatedOrder,
      message: `Order status updated to ${status}`
    });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// DELETE ORDER
// ==============================
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check permissions
    if (!["admin", "cashier"].includes(user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin or cashier can delete orders"
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Prevent deletion of completed orders unless admin
    if (order.status === "completed" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete completed orders"
      });
    }

    await Order.findByIdAndDelete(id);

    // Socket event (use global.io)
    if (global.io) {
      global.io.emit("order:deleted", {
        orderId: id,
        orderNumber: order.orderNumber,
        deletedBy: user.name || "Staff",
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Order ${order.orderNumber} deleted successfully`
    });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ORDER BY STRIPE SESSION ID
// ==============================
export const getOrderByStripeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const order = await Order.findOne({ stripeSessionId: sessionId })
      .populate('user', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this session"
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error("Get order by session error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ACTIVE ORDERS (KITCHEN/CASHIER)
// ==============================
export const getActiveOrders = async (req, res) => {
  try {
    const activeStatuses = ["confirmed", "preparing", "ready"];
    
    const orders = await Order.find({ status: { $in: activeStatuses } })
      .sort({ createdAt: 1 })
      .populate('user', 'name email phone')
      .populate('createdBy', 'name')
      .lean();

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (err) {
    console.error("Get active orders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ALL ORDERS (ADMIN)
// ==============================
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email phone')
        .populate('createdBy', 'name')
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// CANCEL ORDER (CUSTOMER)
// ==============================
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify ownership
    if (order.customerId !== (user?._id || user?.customerId)) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders"
      });
    }

    // Check if cancellable
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in ${order.status} status`
      });
    }

    order.status = "cancelled";
    await order.save();

    // Refund if paid online
    if (order.paymentMethod === "online" && order.paymentStatus === "paid") {
      // Trigger refund process
      order.paymentStatus = "refunded";
      await order.save();
    }

    // Socket event (use global.io)
    if (global.io) {
      global.io.emit("order:cancelled", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        cancelledBy: "customer"
      });
    }

    res.json({
      success: true,
      data: order,
      message: "Order cancelled successfully"
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ORDER BY ID
// ==============================
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('createdBy', 'name')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check permissions
    const canView = 
      // User owns the order (compare string ids)
      order.customerId === (user?._id?.toString() || user?.customerId) ||
      // User is staff
      ["admin", "cashier", "kitchen"].includes(user?.role) ||
      // Guest with matching guest ID
      (user?.isGuest && order.customerId === user._id?.toString());

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order"
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// UPDATE PAYMENT STATUS
// ==============================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validStatuses = ["pending", "paid", "failed", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.paymentStatus = paymentStatus;
    order.paidAt = paymentStatus === "paid" ? new Date() : null;
    await order.save();

    // Socket event (use global.io)
    if (global.io) {
      global.io.emit("order:payment-updated", {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderNumber: order.orderNumber
      });

      if (order.customerId) {
        global.io.to(`user:${order.customerId}`).emit("order:your-payment-updated", {
          orderId: order._id,
          paymentStatus: order.paymentStatus
        });
      }
    }

    res.json({
      success: true,
      data: order,
      message: `Payment status updated to ${paymentStatus}`
    });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};