// cashierSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

const unwrap = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

// Fetch all orders (with filters)
export const fetchCashierOrders = createAsyncThunk(
  "cashier/fetchOrders",
  async ({ status, page = 1, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      
      const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await api.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create direct order
export const createDirectOrderCashier = createAsyncThunk(
  "cashier/createDirect",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/orders/direct", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update order status
export const cashierUpdateStatus = createAsyncThunk(
  "cashier/updateStatus",
  async ({ orderId, status, estimatedTime }, { rejectWithValue }) => {
    try {
      const body = {};
      if (status !== undefined) body.status = status;
      if (estimatedTime !== undefined) body.estimatedTime = estimatedTime;
      
      const res = await api.patch(`/api/orders/${orderId}/status`, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update estimated time only
export const cashierUpdateEstimatedTime = createAsyncThunk(
  "cashier/updateEstimatedTime",
  async ({ orderId, estimatedTime }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { estimatedTime });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Mark payment
export const cashierMarkPayment = createAsyncThunk(
  "cashier/markPayment",
  async ({ orderId, paymentMethod = "cash", paymentStatus = "paid" }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/payment`, { 
        paymentMethod, 
        paymentStatus 
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete order
export const cashierDeleteOrder = createAsyncThunk(
  "cashier/deleteOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/orders/${orderId}`);
      return orderId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update customer info
export const cashierUpdateCustomerInfo = createAsyncThunk(
  "cashier/updateCustomerInfo",
  async ({ orderId, customerInfo }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/customer-info`, customerInfo);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Link guest order to user
export const cashierLinkOrderToUser = createAsyncThunk(
  "cashier/linkOrderToUser",
  async ({ orderId, userId }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/link-user`, { userId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const cashierSlice = createSlice({
  name: "cashier",
  initialState: {
    orders: [],
    filteredOrders: [],
    activeOrders: [],
    pendingOrders: [],
    loading: false,
    error: null,
    successMessage: null,
    socketConnected: false,
    newOrderNotification: null,
  },
  reducers: {
    clearCashierMessages(state) {
      state.error = null;
      state.successMessage = null;
      state.newOrderNotification = null;
    },
    
    // Socket event handlers
    socketNewOrder: (state, action) => {
      const newOrder = action.payload;
      if (!newOrder?._id) return;
      
      // Add to all orders
      if (!state.orders.find(o => o._id === newOrder._id)) {
        state.orders.unshift(newOrder);
      }
      
      // Add to filtered orders if matches criteria
      if (newOrder.status === "pending" || newOrder.status === "confirmed") {
        if (!state.pendingOrders.find(o => o._id === newOrder._id)) {
          state.pendingOrders.unshift(newOrder);
        }
      }
      
      // Add to active orders if applicable
      if (["pending", "confirmed", "preparing", "ready"].includes(newOrder.status)) {
        if (!state.activeOrders.find(o => o._id === newOrder._id)) {
          state.activeOrders.unshift(newOrder);
        }
      }
      
      // Set notification
      state.newOrderNotification = {
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerInfo?.name || "Guest",
        serviceType: newOrder.serviceType,
        timestamp: new Date()
      };
    },
    
    socketOrderUpdated: (state, action) => {
      const updatedOrder = action.payload;
      if (!updatedOrder?._id) return;
      
      // Update in all arrays
      state.orders = state.orders.map(o => 
        o._id === updatedOrder._id ? updatedOrder : o
      );
      
      state.filteredOrders = state.filteredOrders.map(o => 
        o._id === updatedOrder._id ? updatedOrder : o
      );
      
      state.activeOrders = state.activeOrders.map(o => 
        o._id === updatedOrder._id ? updatedOrder : o
      );
      
      state.pendingOrders = state.pendingOrders.map(o => 
        o._id === updatedOrder._id ? updatedOrder : o
      );
      
      // Remove from pending if no longer pending/confirmed
      if (!["pending", "confirmed"].includes(updatedOrder.status)) {
        state.pendingOrders = state.pendingOrders.filter(o => o._id !== updatedOrder._id);
      }
      
      // Remove from active if completed/cancelled
      if (["completed", "cancelled"].includes(updatedOrder.status)) {
        state.activeOrders = state.activeOrders.filter(o => o._id !== updatedOrder._id);
      }
    },
    
    socketOrderDeleted: (state, action) => {
      const { orderId } = action.payload;
      
      // Remove from all arrays
      state.orders = state.orders.filter(o => o._id !== orderId);
      state.filteredOrders = state.filteredOrders.filter(o => o._id !== orderId);
      state.activeOrders = state.activeOrders.filter(o => o._id !== orderId);
      state.pendingOrders = state.pendingOrders.filter(o => o._id !== orderId);
    },
    
    socketPaymentUpdated: (state, action) => {
      const updatedOrder = action.payload;
      if (!updatedOrder?._id) return;
      
      // Update payment status in all arrays
      state.orders = state.orders.map(o => 
        o._id === updatedOrder._id ? updatedOrder : o
      );
    },
    
    // Filter orders by status
    filterOrdersByStatus: (state, action) => {
      const status = action.payload;
      if (!status) {
        state.filteredOrders = [...state.orders];
      } else {
        state.filteredOrders = state.orders.filter(order => order.status === status);
      }
    },
    
    // Search orders
    searchOrders: (state, action) => {
      const query = action.payload.toLowerCase();
      state.filteredOrders = state.orders.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customerInfo?.name?.toLowerCase().includes(query) ||
        order.customerInfo?.phone?.includes(query)
      );
    },
    
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    
    clearNewOrderNotification: (state) => {
      state.newOrderNotification = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // FETCH ORDERS
      .addCase(fetchCashierOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashierOrders.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.orders = Array.isArray(action.payload.data) ? action.payload.data : [];
          state.filteredOrders = [...state.orders];
          
          // Separate pending and active orders
          state.pendingOrders = state.orders.filter(o => 
            ["pending", "confirmed"].includes(o.status)
          );
          state.activeOrders = state.orders.filter(o => 
            ["pending", "confirmed", "preparing", "ready"].includes(o.status)
          );
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(fetchCashierOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch orders";
      })

      // CREATE DIRECT ORDER
      .addCase(createDirectOrderCashier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDirectOrderCashier.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const created = action.payload.data;
          state.successMessage = "Direct order created";
          
          // Add to all arrays
          state.orders.unshift(created);
          state.filteredOrders.unshift(created);
          state.pendingOrders.unshift(created);
          state.activeOrders.unshift(created);
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(createDirectOrderCashier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create direct order";
      })

      // UPDATE STATUS
      .addCase(cashierUpdateStatus.fulfilled, (state, action) => {
        if (action.payload.success) {
          const updated = action.payload.data;
          state.successMessage = `Order status updated to ${updated.status}`;
        }
      })

      // UPDATE ESTIMATED TIME
      .addCase(cashierUpdateEstimatedTime.fulfilled, (state, action) => {
        if (action.payload.success) {
          const updated = action.payload.data;
          state.successMessage = `Estimated time updated to ${updated.estimatedTime} minutes`;
        }
      })

      // MARK PAYMENT
      .addCase(cashierMarkPayment.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.successMessage = "Payment marked successfully";
        }
      })

      // DELETE ORDER
      .addCase(cashierDeleteOrder.fulfilled, (state, action) => {
        const orderId = action.payload;
        
        // Remove from all arrays
        state.orders = state.orders.filter(o => o._id !== orderId);
        state.filteredOrders = state.filteredOrders.filter(o => o._id !== orderId);
        state.activeOrders = state.activeOrders.filter(o => o._id !== orderId);
        state.pendingOrders = state.pendingOrders.filter(o => o._id !== orderId);
        
        state.successMessage = "Order deleted successfully";
      })

      // LINK ORDER TO USER
      .addCase(cashierLinkOrderToUser.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.successMessage = "Order linked to user account";
        }
      });
  }
});

export const {
  clearCashierMessages,
  socketNewOrder,
  socketOrderUpdated,
  socketOrderDeleted,
  socketPaymentUpdated,
  filterOrdersByStatus,
  searchOrders,
  setSocketConnected,
  clearNewOrderNotification
} = cashierSlice.actions;

export default cashierSlice.reducer;