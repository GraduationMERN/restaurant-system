import { store } from "../redux/store";
import {
  socketOrderCreated,
  socketOrderUpdated,
  socketOrderDeleted,
  socketPaymentUpdated,
} from "../redux/slices/orderSlice";

import {
  handlePaymentUpdate,
  handleStatusUpdate,
  updateActiveOrderFromSocket,
} from "../redux/slices/ordersSlice";

import {
  socketPaymentSuccess,
  socketPaymentFailed,
  socketPaymentRefunded,
} from "../redux/slices/paymentSlice";

import {
  socketNewOrder as cashierSocketNewOrder,
  socketOrderUpdated as cashierSocketOrderUpdated,
  socketOrderDeleted as cashierSocketOrderDeleted,
  socketPaymentUpdated as cashierSocketPaymentUpdated,
} from "../redux/slices/cashierSlice";

import {
  socketNewOrder as kitchenSocketNewOrder,
  socketOrderUpdated as kitchenSocketOrderUpdated,
  socketOrderDeleted as kitchenSocketOrderDeleted,
  socketKitchenUpdate,
} from "../redux/slices/kitchenSlice";

/* ----------------------------------------
   STORE HOLDER (Used by main.jsx)
---------------------------------------- */
let reduxStore = null;

export const setStore = (storeInstance) => {
  reduxStore = storeInstance;
};

export const getStore = () => reduxStore;

/* ----------------------------------------
   SOCKET LISTENERS
---------------------------------------- */
export const setupSocketListeners = (socket) => {
  if (!socket) return;

  /* ---- ORDER CREATED ---- */
  const handleCreated = (order) => {
    if (!order) return;
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order created", id);
    store.dispatch(socketOrderCreated(order));
    store.dispatch(cashierSocketNewOrder(order));
    store.dispatch(kitchenSocketNewOrder(order));
  };

  // Support multiple event names emitted by backend
  socket.on("order:created", handleCreated);
  socket.on("order:new", handleCreated);
  socket.on("order:new:paid", handleCreated);
  socket.on("order:new:online", handleCreated);
  socket.on("order:new:instore", handleCreated);
  socket.on("order:direct", handleCreated);


  /* ---- ORDER UPDATED ---- */
  const handleUpdated = (order) => {
    if (!order) return;
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order updated", id, order.status);
    // Ensure payload has _id for reducers that expect it
    const payload = { _id: id, ...order };
    store.dispatch(socketOrderUpdated(payload));
    store.dispatch(cashierSocketOrderUpdated(payload));
    store.dispatch(kitchenSocketOrderUpdated(payload));
  };

  socket.on("order:updated", handleUpdated);
  socket.on("order:status-changed", (data) => {
    // backend may send a lightweight object { orderId, status, estimatedReadyTime }
    const id = data._id || data.orderId || data.id;
    const payload = { _id: id, ...data };
    handleUpdated(payload);
  });
  socket.on("order:your-status-changed", (data) => {
    const id = data._id || data.orderId || data.id;
    const payload = { _id: id, ...data };
    handleUpdated(payload);
  });

  /* ---- ORDER DELETED ---- */
  socket.on("order:deleted", (data) => {
    const id = data.orderId || data._id || data.id;
    console.log("Socket: order:deleted", id);
    const payload = { orderId: id };
    store.dispatch(socketOrderDeleted(payload));
    store.dispatch(cashierSocketOrderDeleted(payload));
    store.dispatch(kitchenSocketOrderDeleted(payload));
  });

  /* ----------------------------------------
     PAYMENT EVENTS
  ---------------------------------------- */

  socket.on("order:payment:success", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:payment:success", id);
    const payload = { _id: id, ...order };
    // Use payment-specific updater to avoid overwriting full order objects with lightweight payloads
    store.dispatch(socketPaymentUpdated(payload));
    store.dispatch(socketPaymentSuccess(payload));
    store.dispatch(cashierSocketOrderUpdated(payload));
    store.dispatch(cashierSocketPaymentUpdated(payload));
  });

  socket.on("order:payment:confirmed", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:payment:confirmed", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketPaymentSuccess(payload));
  });

  // Generic payment update emitted by order controller
  socket.on("order:payment-updated", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:payment-updated", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketPaymentUpdated(payload));
    store.dispatch(socketOrderUpdated(payload));
    store.dispatch(cashierSocketPaymentUpdated(payload));
    store.dispatch(cashierSocketOrderUpdated(payload));
    store.dispatch(kitchenSocketOrderUpdated(payload));
  });

  socket.on("order:refunded", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:refunded", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketPaymentUpdated(payload));
    store.dispatch(socketPaymentRefunded(payload));
    store.dispatch(cashierSocketOrderUpdated(payload));
    store.dispatch(cashierSocketPaymentUpdated(payload));
  });

  // Refund-specific processed event for user notifications
  socket.on("order:refund:processed", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:refund:processed", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketPaymentUpdated(payload));
    store.dispatch(socketPaymentRefunded(payload));
  });

  /* ----------------------------------------
     ORDERS SLICE LISTENERS (for user order tracking)
  ---------------------------------------- */
  
  // Customer payment update
  socket.on("order:your-payment-updated", (data) => {
    const id = data._id || data.orderId || data.id;
    console.log("Socket: order:your-payment-updated", id);
    const paymentStatus = data.paymentStatus || "pending";
    store.dispatch(handlePaymentUpdate({ orderId: id, paymentStatus }));
  });

  // Customer status update
  socket.on("order:your-status-changed", (data) => {
    const id = data._id || data.orderId || data.id;
    console.log("Socket: order:your-status-changed", id);
    store.dispatch(handleStatusUpdate({
      orderId: id,
      status: data.status,
      estimatedReadyTime: data.estimatedReadyTime
    }));
  });

  /* ----------------------------------------
     STATUS EVENTS (confirmed/ready/etc)
  ---------------------------------------- */
  const statusEvents = [
    "order:confirmed",
    "order:preparing",
    "order:ready",
    "order:completed",
    "order:cancelled",
  ];

  statusEvents.forEach((eventName) => {
    socket.on(eventName, (order) => {
      const id = order._id || order.orderId || order.id;
      console.log(`Socket: ${eventName}`, id);
      const payload = { _id: id, ...order };
      store.dispatch(socketOrderUpdated(payload));
      store.dispatch(cashierSocketOrderUpdated(payload));
      store.dispatch(kitchenSocketOrderUpdated(payload));
    });
  });

  /* ----------------------------------------
     KITCHEN EVENTS
  ---------------------------------------- */

  // kitchen update - support both colon and hyphen variants
  socket.on("order:kitchen:update", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:kitchen:update", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketOrderUpdated(payload));
    store.dispatch(socketKitchenUpdate(payload));
  });
  socket.on("order:kitchen-update", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:kitchen-update", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketOrderUpdated(payload));
    store.dispatch(socketKitchenUpdate(payload));
  });

  socket.on("order:ready-notification", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:ready-notification", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketOrderUpdated(payload));
    store.dispatch(cashierSocketOrderUpdated(payload));
  });

  /* ----------------------------------------
     CASHIER EVENTS
  ---------------------------------------- */

  socket.on("order:new:paid", (order) => {
    console.log("Socket: order:new:paid", order._id);
    store.dispatch(socketOrderCreated(order));
    store.dispatch(cashierSocketNewOrder(order));
    store.dispatch(kitchenSocketNewOrder(order));
  });

  socket.on("order:new:online", (order) => {
    console.log("Socket: order:new:online", order._id);
    store.dispatch(socketOrderCreated(order));
    store.dispatch(cashierSocketNewOrder(order));
    store.dispatch(kitchenSocketNewOrder(order));
  });

  socket.on("order:new:instore", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:new:instore", id);
    store.dispatch(socketOrderCreated(order));
    store.dispatch(cashierSocketNewOrder(order));
    store.dispatch(kitchenSocketNewOrder(order));
  });

  // Paid in-store notification (alias)
  socket.on("order:paid:instore", (order) => {
    const id = order._id || order.orderId || order.id;
    console.log("Socket: order:paid:instore", id);
    const payload = { _id: id, ...order };
    store.dispatch(socketPaymentUpdated(payload));
    store.dispatch(cashierSocketOrderUpdated(payload));
    store.dispatch(kitchenSocketOrderUpdated(payload));
  });

  /* ----------------------------------------
     CONNECTION EVENTS
  ---------------------------------------- */

  socket.on("connect", () => {

  });

  socket.on("disconnect", () => {
  
  });

  socket.on("connect_error", (error) => {
  });
};

/* ----------------------------------------
   JOIN ROOMS BASED ON USER ROLE
---------------------------------------- */
export const joinSocketRooms = (socket, user) => {
  if (!socket || !user) return;


  const userId = user._id || user.customerId;

  if (userId) {
    socket.emit("register", userId);
    // server joins both `userId` and `user:<id>` on register; we explicitly join role rooms
  }

  if (user.role) {
    socket.emit("joinRole", user.role);

    if (user.role === "kitchen") {
      socket.emit("joinKitchen");
    }

    if (user.role === "cashier") {
      socket.emit("joinCashier");
    }

    if (user.role === "admin") {
      socket.emit("joinAdmin");
    }
  }
};

/* ----------------------------------------
   SOCKET CLIENT (compatibility helpers)
   Provide initSocket/getSocket used across the app
---------------------------------------- */
import { io as ioClient } from "socket.io-client";

let socketInstance = null;

export const initSocket = (options = {}) => {
  if (socketInstance) return socketInstance;
  const BASE = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  try {
    socketInstance = ioClient(BASE, {
      transports: ["websocket"],
      withCredentials: true,
      ...options
    });

    // attach listeners
    setupSocketListeners(socketInstance);

    // auto-join rooms if store set
    try {
      const st = reduxStore || store;
      const user = st.getState?.().auth?.user;
      if (user) joinSocketRooms(socketInstance, user);
    } catch (e) {
      console.warn("Failed to auto-join rooms", e.message);
    }

    return socketInstance;
  } catch (e) {
    console.error("Failed to init socket", e.message);
    return null;
  }
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

const defaultExport = {
  initSocket,
  getSocket,
  disconnectSocket,
  setupSocketListeners,
  joinSocketRooms,
  setStore,
  getStore
};

export default defaultExport;
