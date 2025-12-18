import mongoose from "mongoose";
import orderService from "./order.service.js";
import PaymentService from "../payment/paymentService.js";
import Order from "../order.module/orderModel.js";
// Avoid importing server.js here to prevent circular imports.
// Use `global.io` and `global.notificationService` which are set in `server.js` after initialization.
import { notificationService , io } from "../../../server.js";
import pushNotificationService from "../instagram/notification/pushNotification.service.js";
import { sendOrderStatusNotifications } from "../../utils/notificationHelper.js";
import { earningPoints } from "../rewards/reward.service.js";
import { v4 as uuidv4 } from "uuid";

// ==============================
// GET ORDER USER ID - Handle both authenticated and guest users (same pattern as cart)
// ==============================
function getOrderUserId(req, res) {
  // Authenticated user
  if (req.user?._id) {
    return req.user._id.toString();
  }

  // Guest user - use UUID stored in cookie (like cart does)
  let guestId = req.cookies.guestOrderId;

  const isProduction = process.env.NODE_ENV === "production";

  if (!guestId) {
    guestId = uuidv4();
    console.log("[ORDER] No guestOrderId found → Generating:", guestId);
    console.log("[ORDER] Current cookies:", req.cookies);
    
    res.cookie("guestOrderId", guestId, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
    });
  } else {
    console.log("[ORDER] Existing guestOrderId found:", guestId);
  }

  return guestId;
}

// ==============================
// GET GUEST ID - Ensure guest gets a consistent UUID in cookies
// ==============================
export const getGuestId = async (req, res) => {
  try {
    const guestId = getOrderUserId(req, res);
    
    res.json({
      success: true,
      guestId: guestId
    });
  } catch (err) {
    console.error("Get guest ID error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

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
    
    // Generate customerId using the same pattern as cart
    const customerId = getOrderUserId(req, res);
    
    const orderData = {
      cartId,
      serviceType,
      tableNumber,
      notes,
      paymentMethod,
      customerInfo,
      // Pass user info based on authentication
      customerId: customerId,
      isGuest: user?.isGuest || false,
      customerType: user?.isGuest ? "guest" : "registered",
      user: user?.isGuest ? null : user?._id
    };

    const order = await orderService.createOrderFromCart(orderData);
    // Optional Notification to admin
    await notificationService?.sendToAdmin({
      title: "New Order",
      message: `A new order was created by ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
      estimatedReadyTime: order.formattedEstimatedTime,
    });
    // Also notify cashiers specifically
    await notificationService?.sendToRole("cashier", {
      title: "New Order",
      message: `New pending order from ${order.customerInfo?.name || "Guest"}`,
      orderId: order._id,
      estimatedReadyTime: order.formattedEstimatedTime,
    });

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
      console.log(`[SOCKET] Emitting order:new to cashier & kitchen. Order: ${populatedOrder.orderNumber}`);
      // Emit to specific rooms
      global.io.to("cashier").emit("order:new", populatedOrder);
      global.io.to("kitchen").emit("order:new", populatedOrder);

      // Emit to customer if they're online (standardize on `user:<id>` room)
      if (populatedOrder.customerId) {
        global.io.to(`user:${populatedOrder.customerId}`).emit("order:created", populatedOrder);
      }
    } else {
      console.warn("[SOCKET] global.io NOT available for emitting order:new");
    }

    // Send push notification to user
    if (order.userId) {
      await pushNotificationService.notifyOrderCreated(order.userId, order);
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
      estimatedTime = 25,
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

    // Validate and transform items - ensure productId and totalPrice
    const transformedItems = items.map(item => {
      if (!item.productId && !item.name) {
        throw new Error("Each item must have either productId or name");
      }
      
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      const totalPrice = price * quantity;
      
      return {
        productId: item.productId || new mongoose.Types.ObjectId(), // Generate temp ID if not provided
        name: item.name || "Custom Item",
        price: price,
        quantity: quantity,
        totalPrice: totalPrice,
        image: item.image || "",
        selectedOptions: item.selectedOptions || {},
        totalPoints: item.totalPoints || 0
      };
    });

    // Calculate totals
    const subtotal = transformedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vat = subtotal * 0.15; // 15% VAT example
    const totalAmount = subtotal + vat;

    // Create guest customer ID for walk-in
    const guestId = `walkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderNumber = `ORD-${timestamp}-${random}`;

    const orderData = {
      orderNumber, // Explicitly set orderNumber
      items: transformedItems,
      serviceType,
      tableNumber: serviceType === "dine-in" ? tableNumber : undefined,
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
      status: "confirmed", // Skip pending for direct orders
      createdBy: req.user?._id, // Cashier who created
    };

    const order = await Order.create(orderData);
    
    // Verify order was created with orderNumber
    if (!order.orderNumber) {
      console.error("Order created without orderNumber:", order);
      throw new Error("Failed to generate orderNumber");
    }
    
    // Populate full order details
    const populatedOrder = await Order.findById(order._id)
      .populate('createdBy', 'name email')
      .lean();

    // Socket events (use global.io)
    if (global.io) {
      global.io.to("kitchen").emit("order:new", populatedOrder);
      global.io.to("cashier").emit("order:new", populatedOrder);
    }

    res.status(201).json({
      success: true,
      data: populatedOrder
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
// ANALYTICS / STATS
// ==============================
export const getOverviewStats = async (req, res) => {
  try {
    const { from = null, to = null } = req.query;
    const data = await orderService.getOverviewStats(from, to);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Get overview stats error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getDailyStats = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const data = await orderService.getDailyStats(days);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Get daily stats error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getTopItems = async (req, res) => {
  try {
    const { from = null, to = null, by = "product" } = req.query;
    const data = await orderService.getTopItems(from, to, by);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Get top items error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getRecentOrdersList = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const data = await orderService.getRecentOrders(limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Get recent orders error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// ADMIN / CASHIER UPDATES
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

    // Authorization: Role-based status update restrictions
    const userRole = user?.role;
    console.log("User role:", userRole, "Status:", status);
    
    if (userRole === "cashier") {
      // Cashiers can update to any status except 'preparing' and 'ready'
      if (["preparing", "ready"].includes(status)) {
        return res.status(403).json({
          success: false,
          message: "Cashiers cannot change orders to 'preparing' or 'ready'. Only kitchen staff can update these statuses."
        });
      }
    } else if (userRole === "kitchen") {
      // Kitchen can only update to 'preparing' or 'ready'
      if (!["preparing", "ready"].includes(status)) {
        return res.status(403).json({
          success: false,
          message: "Kitchen staff can only change orders to 'preparing' or 'ready'."
        });
      }
    }
    // Admin can update to any status

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

    await order.save({ validateModifiedOnly: true });

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('createdBy', 'name')
      .lean();

    // Socket events (use global.io)
    if (global.io) {
      // Emit full order data to all listeners
      global.io.emit("order:status-changed", {
        orderId: populatedOrder._id,
        _id: populatedOrder._id,
        status: populatedOrder.status,
        orderNumber: populatedOrder.orderNumber,
        estimatedReadyTime: populatedOrder.estimatedReadyTime,
        updatedBy: user?.name || "System"
      });

      // Room-specific events with full order data
      if (["preparing", "ready"].includes(status)) {
        global.io.to("kitchen").emit("order:kitchen-update", populatedOrder);
      }

      if (status === "ready") {
        global.io.to("cashier").emit("order:ready-notification", populatedOrder);
      }
      if (status === "completed") {
        await earningPoints(populatedOrder._id);
      }

      // Customer notification (standardize to `user:<id>`)
      if (populatedOrder.customerId) {
        global.io.to(`user:${populatedOrder.customerId}`).emit("order:your-status-changed", {
          orderId: populatedOrder._id,
          _id: populatedOrder._id,
          status: populatedOrder.status,
          estimatedTime: populatedOrder.estimatedTime,
          estimatedReadyTime: populatedOrder.estimatedReadyTime
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
    export const updateOwnOrder = async (req, res, next) => {
  // implementation to update an order
};

// ==============================
// CANCEL ORDER (CUSTOMER)
// ==============================
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Get the user's identifier using the same pattern as cart
    const userId = getOrderUserId(req, res);

    console.log("[CANCEL] userId:", userId);
    console.log("[CANCEL] order.customerId:", order.customerId);
    console.log("[CANCEL] cookies:", req.cookies);

    // Verify ownership
    if (order.customerId !== userId) {
      console.log("[CANCEL] Ownership check failed!");
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders"
      });
    }

    console.log("[CANCEL] Ownership verified, cancelling order");

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

    console.log("[GET ORDER] Request for:", id);
    console.log("[GET ORDER] User:", { _id: user?._id, isGuest: user?.isGuest });
    console.log("[GET ORDER] Cookies:", req.cookies);

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

    console.log("[GET ORDER] Found order with customerId:", order.customerId);

    // Check permissions using same logic as getOrderUserId
    // Allow if:
    // 1. User is authenticated and owns the order
    // 2. OR User is a guest accessing their own order (via UUID in cookie)
    // 3. OR User is staff (admin, cashier, kitchen)
    const userId = getOrderUserId(req, res);
    const userIdStr = user?._id?.toString();
    const isOwner = userIdStr && order.customerId === userIdStr;
    const isGuestOwner = !user?._id && userId === order.customerId;
    const isStaff = ["admin", "cashier", "kitchen"].includes(user?.role);

    console.log("[GET ORDER] Permission check:", {
      userId,
      userIdStr,
      orderCustomerId: order.customerId,
      isOwner,
      isGuestOwner,
      isStaff
    });

    const canView = isOwner || isGuestOwner || isStaff;

    if (!canView) {
      console.log("[GET ORDER] Permission denied for user:", userId);
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
    const user = req.user;

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

    // Authorization: Only cashier/admin can manually update payment status
    const isCashierOrAdmin = ["cashier", "admin"].includes(user?.role);
    if (!isCashierOrAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only cashier or admin can update payment status"
      });
    }

    // Log for debugging
    console.log("[UPDATE PAYMENT]", {
      orderId: id,
      paymentMethod: order.paymentMethod,
      requestedStatus: paymentStatus,
      userRole: user?.role,
      isCashierOrAdmin
    });

    order.paymentStatus = paymentStatus;
    order.paidAt = paymentStatus === "paid" ? new Date() : null;
    await order.save();

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('createdBy', 'name')
      .lean();

    // Emit socket events to notify all interested parties
    if (global.io) {
      // Broadcast to cashier
      global.io.to("cashier").emit("order:payment-updated", populatedOrder);
      
      // Customer gets personalized event
      if (populatedOrder.customerId) {
        global.io.to(`user:${populatedOrder.customerId}`).emit("order:your-payment-updated", {
          orderId: populatedOrder._id,
          _id: populatedOrder._id,
          paymentStatus: populatedOrder.paymentStatus,
          paidAt: populatedOrder.paidAt
        });
      }
      
      // Kitchen gets update
      global.io.to("kitchen").emit("order:payment-updated", populatedOrder);
    }

    res.json({
      success: true,
      data: populatedOrder,
      message: `Payment status updated to ${paymentStatus}`
    });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ACTIVE ORDER (First non-completed)
// ==============================
export const getActiveOrder = async (req, res) => {
  try {
    // Get the user's identifier using the same pattern as cart
    const userId = getOrderUserId(req, res);

    console.log("[GET ACTIVE] userId:", userId);
    console.log("[GET ACTIVE] cookies:", req.cookies);

    if (!userId) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Find the first non-completed order
    const activeOrder = await Order.findOne({
      customerId: userId,
      status: { $in: ["pending", "confirmed", "preparing", "ready"] }
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .lean();

    console.log("[GET ACTIVE] Found order:", activeOrder?._id);

    res.json({
      success: true,
      data: activeOrder || null
    });
  } catch (err) {
    console.error("Get active order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ORDER HISTORY FOR USER
// ==============================
export const getOrderHistoryForUser = async (req, res) => {
  try {
    // Get the user's identifier using the same pattern as cart
    const userId = getOrderUserId(req, res);

    if (!userId) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Find all completed/past orders
    const orderHistory = await Order.find({
      customerId: userId,
      status: { $in: ["completed", "cancelled", "refunded"] }
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .lean();

    res.json({
      success: true,
      data: orderHistory || []
    });
  } catch (err) {
    console.error("Get order history error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};