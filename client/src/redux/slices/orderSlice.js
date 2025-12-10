// orderSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Helper to normalize backend response
const unwrap = (payload) => {
  // Backend returns { success: boolean, data: any, message?: string }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

/* ===========================
   THUNKS (UPDATED FOR NEW BACKEND)
=========================== */

// Create order from cart (checkout flow)
export const createOrderFromCart = createAsyncThunk(
  "order/createFromCart",
  async (orderPayload, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/orders/from-cart", orderPayload);
      return res.data; // { success: true, data: order }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create direct order (cashier)
export const createDirectOrder = createAsyncThunk(
  "order/createDirect",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/orders/direct", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch single order by id
export const fetchOrderById = createAsyncThunk(
  "order/fetchById",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔥 NEW: Fetch order by Stripe session ID (for payment success page)
export const fetchOrderBySessionId = createAsyncThunk(
  "order/fetchBySessionId",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/orders/session/${sessionId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch orders for a specific user (works for both guest and registered)
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async (userId, { rejectWithValue, getState }) => {
    try {
      // Use provided userId or get from auth state
      const state = getState();
      const id = userId || state?.auth?.user?._id || state?.auth?.user?.customerId;
      
      if (!id) {
        return rejectWithValue("User ID not available");
      }
      
      const res = await api.get(`/api/orders/user/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Cancel own order (with guest support)
export const cancelOwnOrder = createAsyncThunk(
  "order/cancelOwn",
  async (orderId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const user = state.auth.user;
      
      // Add guestId for guest users
      const payload = user?.isGuest ? { guestId: user._id } : {};
      
      const res = await api.patch(`/api/orders/${orderId}/cancel`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete order (admin/cashier only)
export const deleteOrder = createAsyncThunk(
  "order/delete",
  async (orderId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/orders/${orderId}`);
      return orderId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Admin: fetch all orders with pagination
export const fetchAllOrders = createAsyncThunk(
  "order/fetchAll",
  async ({ page = 1, limit = 50, status } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (status) params.append('status', status);
      
      const res = await api.get(`/api/orders?${params.toString()}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update order status (cashier/kitchen/admin)
export const updateOrderStatus = createAsyncThunk(
  "order/updateStatus",
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

// 🔥 NEW: Update estimated time only (cashier dashboard)
export const updateEstimatedTime = createAsyncThunk(
  "order/updateEstimatedTime",
  async ({ orderId, estimatedTime }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { estimatedTime });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update payment information
export const updatePayment = createAsyncThunk(
  "order/updatePayment",
  async ({ orderId, paymentMethod, paymentStatus, refundAmount }, { rejectWithValue }) => {
    try {
      const body = {};
      if (paymentMethod !== undefined) body.paymentMethod = paymentMethod;
      if (paymentStatus !== undefined) body.paymentStatus = paymentStatus;
      if (refundAmount !== undefined) body.refundAmount = refundAmount;
      
      const res = await api.patch(`/api/orders/${orderId}/payment`, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Kitchen/Cashier: fetch active orders
export const fetchActiveOrders = createAsyncThunk(
  "order/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders/kitchen/active");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔥 NEW: Link guest order to registered user
export const linkOrderToUser = createAsyncThunk(
  "order/linkToUser",
  async ({ orderId, userId }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/link-user`, { userId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ===========================
   SLICE (UPDATED WITH SOCKET SUPPORT)
=========================== */

const orderSlice = createSlice({
  name: "order",
  initialState: {
    userOrders: [],
    allOrders: [],
    activeOrders: [],
    singleOrder: null,
    loading: false,
    error: null,
    successMessage: null,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      pages: 1
    }
  },
  reducers: {
    clearOrderMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    
    clearSingleOrder(state) {
      state.singleOrder = null;
    },
    
    // 🔥 NEW: Socket event handlers
    socketOrderCreated: (state, action) => {
      const newOrder = action.payload;
      if (!newOrder?._id) return;

      // Add to active orders if applicable
      if (["pending", "confirmed", "preparing", "ready"].includes(newOrder.status)) {
        // Prevent duplicates
        if (!state.activeOrders.find(o => o._id === newOrder._id)) {
          state.activeOrders.unshift(newOrder);
        }
      }
    },

    // Upsert helper for single-order updates
    upsertOrder: (state, action) => {
      const order = action.payload;
      if (!order?._id) return;

      // Update singleOrder
      if (state.singleOrder?._id === order._id) state.singleOrder = order;

      // Upsert in userOrders
      const ui = state.userOrders.findIndex(o => o._id === order._id);
      if (ui !== -1) state.userOrders[ui] = order;
      else state.userOrders.unshift(order);

      // Upsert in allOrders
      const ai = state.allOrders.findIndex(o => o._id === order._id);
      if (ai !== -1) state.allOrders[ai] = order;
      else state.allOrders.unshift(order);

      // Upsert in activeOrders
      const actIdx = state.activeOrders.findIndex(o => o._id === order._id);
      if (actIdx !== -1) {
        if (["completed", "cancelled"].includes(order.status)) {
          state.activeOrders.splice(actIdx, 1);
        } else {
          state.activeOrders[actIdx] = order;
        }
      } else if (["pending", "confirmed", "preparing", "ready"].includes(order.status)) {
        state.activeOrders.unshift(order);
      }
    },
    
    socketOrderUpdated: (state, action) => {
      const updatedOrder = action.payload;
      if (!updatedOrder?._id) return;
      
      // Update single order if it's the one being viewed
      if (state.singleOrder?._id === updatedOrder._id) {
        state.singleOrder = updatedOrder;
      }
      
      // Update in user orders
      state.userOrders = state.userOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      );
      
      // Update in all orders
      state.allOrders = state.allOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      );
      
      // Update in active orders
      const activeIndex = state.activeOrders.findIndex(o => o._id === updatedOrder._id);
      if (activeIndex !== -1) {
        if (["completed", "cancelled"].includes(updatedOrder.status)) {
          // Remove from active orders
          state.activeOrders.splice(activeIndex, 1);
        } else {
          // Update in active orders
          state.activeOrders[activeIndex] = updatedOrder;
        }
      } else if (["pending", "confirmed", "preparing", "ready"].includes(updatedOrder.status)) {
        // Add to active orders if not already there
        state.activeOrders.unshift(updatedOrder);
      }
    },
    
    socketOrderDeleted: (state, action) => {
      const { orderId } = action.payload;
      
      // Remove from all arrays
      state.userOrders = state.userOrders.filter(o => o._id !== orderId);
      state.allOrders = state.allOrders.filter(o => o._id !== orderId);
      state.activeOrders = state.activeOrders.filter(o => o._id !== orderId);
      
      // Clear single order if it's the deleted one
      if (state.singleOrder?._id === orderId) {
        state.singleOrder = null;
      }
    },
    
    socketPaymentUpdated: (state, action) => {
      const updatedOrder = action.payload;
      if (!updatedOrder?._id) return;
      
      // Update payment status in all relevant places
      if (state.singleOrder?._id === updatedOrder._id) {
        state.singleOrder = updatedOrder;
      }
      
      state.userOrders = state.userOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      );
      
      state.allOrders = state.allOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      );
      
      state.activeOrders = state.activeOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      );
    }
  },
  extraReducers: (builder) => {
    builder
      // CREATE ORDER FROM CART
      .addCase(createOrderFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrderFromCart.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload;
        if (response.success) {
          state.singleOrder = response.data;
          state.userOrders.unshift(response.data);
          state.successMessage = "Order created successfully";
        } else {
          state.error = response.message || "Failed to create order";
        }
      })
      .addCase(createOrderFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create order";
      })

      // CREATE DIRECT ORDER
      .addCase(createDirectOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDirectOrder.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload;
        if (response.success) {
          state.singleOrder = response.data;
          state.activeOrders.unshift(response.data);
          state.successMessage = "Direct order created";
        } else {
          state.error = response.message;
        }
      })
      .addCase(createDirectOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create direct order";
      })

      // FETCH ORDER BY ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload === null) {
          state.singleOrder = null;
        } else if (action.payload.success) {
          state.singleOrder = action.payload.data;
        } else {
          state.singleOrder = null;
        }
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch order";
      })

      // 🔥 NEW: FETCH ORDER BY SESSION ID
      .addCase(fetchOrderBySessionId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderBySessionId.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.singleOrder = action.payload.data;
        } else {
          state.error = action.payload.message;
          state.singleOrder = null;
        }
      })
      .addCase(fetchOrderBySessionId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch order by session";
        state.singleOrder = null;
      })

      // FETCH USER ORDERS
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.userOrders = Array.isArray(action.payload.data) ? action.payload.data : [];
        } else {
          state.userOrders = [];
          state.error = action.payload.message;
        }
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch user orders";
        state.userOrders = [];
      })

      // FETCH ALL ORDERS (with pagination)
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.allOrders = Array.isArray(action.payload.data) ? action.payload.data : [];
          state.pagination = action.payload.pagination || state.pagination;
        } else {
          state.allOrders = [];
          state.error = action.payload.message;
        }
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch all orders";
        state.allOrders = [];
      })

      // FETCH ACTIVE ORDERS
      .addCase(fetchActiveOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveOrders.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.activeOrders = Array.isArray(action.payload.data) ? action.payload.data : [];
        } else {
          state.activeOrders = [];
          state.error = action.payload.message;
        }
      })
      .addCase(fetchActiveOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch active orders";
        state.activeOrders = [];
      })

      // UPDATE ORDER STATUS
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const updatedOrder = action.payload.data;
          state.successMessage = `Order status updated to ${updatedOrder.status}`;
          
          // Update in all relevant arrays
          if (state.singleOrder?._id === updatedOrder._id) {
            state.singleOrder = updatedOrder;
          }
          
          state.userOrders = state.userOrders.map(o => 
            o._id === updatedOrder._id ? updatedOrder : o
          );
          
          state.allOrders = state.allOrders.map(o => 
            o._id === updatedOrder._id ? updatedOrder : o
          );
          
          // Update active orders
          const activeIndex = state.activeOrders.findIndex(o => o._id === updatedOrder._id);
          if (activeIndex !== -1) {
            if (["completed", "cancelled"].includes(updatedOrder.status)) {
              state.activeOrders.splice(activeIndex, 1);
            } else {
              state.activeOrders[activeIndex] = updatedOrder;
            }
          }
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update order status";
      })

      // UPDATE ESTIMATED TIME
      .addCase(updateEstimatedTime.fulfilled, (state, action) => {
        if (action.payload.success) {
          const updatedOrder = action.payload.data;
          state.successMessage = `Estimated time updated to ${updatedOrder.estimatedTime} minutes`;
          
          // Update in all relevant arrays
          if (state.singleOrder?._id === updatedOrder._id) {
            state.singleOrder = updatedOrder;
          }
          
          state.activeOrders = state.activeOrders.map(o => 
            o._id === updatedOrder._id ? updatedOrder : o
          );
        }
      })

      // CANCEL OWN ORDER
      .addCase(cancelOwnOrder.fulfilled, (state, action) => {
        if (action.payload.success) {
          const cancelledOrder = action.payload.data;
          state.successMessage = "Order cancelled successfully";
          
          // Update single order
          if (state.singleOrder?._id === cancelledOrder._id) {
            state.singleOrder = cancelledOrder;
          }
          
          // Remove from active orders
          state.activeOrders = state.activeOrders.filter(o => o._id !== cancelledOrder._id);
          
          // Update in user orders
          state.userOrders = state.userOrders.map(o => 
            o._id === cancelledOrder._id ? cancelledOrder : o
          );
        }
      })

      // DELETE ORDER
      .addCase(deleteOrder.fulfilled, (state, action) => {
        const orderId = action.payload;
        
        // Remove from all arrays
        state.userOrders = state.userOrders.filter(o => o._id !== orderId);
        state.allOrders = state.allOrders.filter(o => o._id !== orderId);
        state.activeOrders = state.activeOrders.filter(o => o._id !== orderId);
        
        // Clear single order if it's the deleted one
        if (state.singleOrder?._id === orderId) {
          state.singleOrder = null;
        }
        
        state.successMessage = "Order deleted successfully";
      })

      // LINK ORDER TO USER
      .addCase(linkOrderToUser.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.successMessage = "Order linked to user account";
        }
      });
  }
});

export const {
  clearOrderMessages,
  clearSingleOrder,
  socketOrderCreated,
  socketOrderUpdated,
  socketOrderDeleted,
  socketPaymentUpdated
} = orderSlice.actions;

export const { upsertOrder } = orderSlice.actions;

export default orderSlice.reducer;