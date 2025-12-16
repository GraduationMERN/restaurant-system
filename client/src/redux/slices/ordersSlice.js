// ordersSlice.js - Unified Orders Management (Active + History)
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ===========================
// THUNKS
// ===========================

// Fetch user's active order (first non-completed order)
export const fetchActiveOrder = createAsyncThunk(
  "orders/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders/active");
      return res.data.data || null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch user's order history (all orders)
export const fetchOrderHistory = createAsyncThunk(
  "orders/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders/history");
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch single order by ID
export const fetchOrderById = createAsyncThunk(
  "orders/fetchById",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  "orders/cancel",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/cancel`);
      return res.data.data || res.data;
      if (!order) {
        return rejectWithValue("Order not found");
      }

      if (order.status !== "pending") {
        return rejectWithValue(
          "You can only cancel orders that are pending."
        );
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ===========================
// SLICE
// ===========================
const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    // Active order (single, most recent non-completed)
    activeOrder: null,
    activeOrderLoading: false,
    activeOrderError: null,

    // Order history (array of completed/past orders)
    orderHistory: [],
    historyLoading: false,
    historyError: null,

    // Single order detail view
    selectedOrder: null,
    selectedOrderLoading: false,
    selectedOrderError: null,

    // General state
    lastUpdated: null,
  },

  reducers: {
    // Set active order from local storage (for guests)
    setGuestActiveOrder(state, action) {
      state.activeOrder = action.payload;
    },

    // Clear active order
    clearActiveOrder(state) {
      state.activeOrder = null;
    },

    // Update active order via socket
    updateActiveOrderFromSocket(state, action) {
      if (state.activeOrder && state.activeOrder._id === action.payload._id) {
        state.activeOrder = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },

    // Add order to history
    addToOrderHistory(state, action) {
      const order = action.payload;
      const exists = state.orderHistory.find((o) => o._id === order._id);
      if (!exists) {
        state.orderHistory.unshift(order);
      }
    },

    // Update order in history
    updateOrderInHistory(state, action) {
      const index = state.orderHistory.findIndex((o) => o._id === action.payload._id);
      if (index !== -1) {
        state.orderHistory[index] = action.payload;
      }
    },

    // Update selected order detail
    updateSelectedOrder(state, action) {
      state.selectedOrder = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Clear selected order
    clearSelectedOrder(state) {
      state.selectedOrder = null;
    },

    // Handle socket payment update
    handlePaymentUpdate(state, action) {
      const { orderId, paymentStatus } = action.payload;
      
      if (state.activeOrder && state.activeOrder._id === orderId) {
        state.activeOrder.paymentStatus = paymentStatus;
      }

      const historyOrder = state.orderHistory.find((o) => o._id === orderId);
      if (historyOrder) {
        historyOrder.paymentStatus = paymentStatus;
      }

      if (state.selectedOrder && state.selectedOrder._id === orderId) {
        state.selectedOrder.paymentStatus = paymentStatus;
      }
    },

    // Handle socket status update
    handleStatusUpdate(state, action) {
      const { orderId, status, estimatedReadyTime } = action.payload;
      
      if (state.activeOrder && state.activeOrder._id === orderId) {
        state.activeOrder.status = status;
        if (estimatedReadyTime) {
          state.activeOrder.estimatedReadyTime = estimatedReadyTime;
        }
      }

      const historyOrder = state.orderHistory.find((o) => o._id === orderId);
      if (historyOrder) {
        historyOrder.status = status;
        if (estimatedReadyTime) {
          historyOrder.estimatedReadyTime = estimatedReadyTime;
        }
      }

      if (state.selectedOrder && state.selectedOrder._id === orderId) {
        state.selectedOrder.status = status;
        if (estimatedReadyTime) {
          state.selectedOrder.estimatedReadyTime = estimatedReadyTime;
        }
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch Active Order
    builder
      .addCase(fetchActiveOrder.pending, (state) => {
        state.activeOrderLoading = true;
        state.activeOrderError = null;
      })
      .addCase(fetchActiveOrder.fulfilled, (state, action) => {
        state.activeOrderLoading = false;
        state.activeOrder = action.payload;
      })
      .addCase(fetchActiveOrder.rejected, (state, action) => {
        state.activeOrderLoading = false;
        state.activeOrderError = action.payload;
      });

    // Fetch Order History
    builder
      .addCase(fetchOrderHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.orderHistory = action.payload;
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });

    // Fetch Order By ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.selectedOrderLoading = true;
        state.selectedOrderError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.selectedOrderLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.selectedOrderLoading = false;
        state.selectedOrderError = action.payload;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.activeOrderLoading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.activeOrderLoading = false;
        // Move cancelled order to history
        if (state.activeOrder && state.activeOrder._id === action.payload._id) {
          state.activeOrder = null;
        }
        state.orderHistory.unshift(action.payload);
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.activeOrderLoading = false;
        state.activeOrderError = action.payload;
      });
  },
});

export const {
  setGuestActiveOrder,
  clearActiveOrder,
  updateActiveOrderFromSocket,
  addToOrderHistory,
  updateOrderInHistory,
  updateSelectedOrder,
  clearSelectedOrder,
  handlePaymentUpdate,
  handleStatusUpdate,
} = ordersSlice.actions;

export default ordersSlice.reducer;
