import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Helper to normalize backend response
const unwrap = (payload) => payload?.data ?? payload ?? null;

/* ===========================
   THUNKS
=========================== */

// Create order from cart (checkout flow)
export const createOrderFromCart = createAsyncThunk(
  "order/createFromCart",
  async (orderPayload, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/orders/from-cart", orderPayload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create direct order (kiosk / direct)
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
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch orders for a specific user
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async (userId, { rejectWithValue, getState }) => {
    try {
      // If userId not provided, attempt to read from auth state
      const state = getState();
      const id = userId || state?.auth?.user?._id;
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

// Cancel own order
export const cancelOwnOrder = createAsyncThunk(
  "order/cancelOwn",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/cancel`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete order (admin/cashier only, for cancelled/completed orders)
export const deleteOrder = createAsyncThunk(
  "order/delete",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/api/orders/${orderId}`);
      return orderId; // Return orderId to remove from lists
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Admin: fetch all orders
export const fetchAllOrders = createAsyncThunk(
  "order/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Admin: update order status
export const updateOrderStatus = createAsyncThunk(
  "order/updateStatus",
  async ({ orderId, status, estimatedTime }, { rejectWithValue }) => {
    try {
      const body = {};
      if (typeof status !== "undefined") body.status = status;
      if (typeof estimatedTime !== "undefined") body.estimatedTime = estimatedTime;
      const res = await api.patch(`/api/orders/${orderId}/status`, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Kitchen/Cashier: fetch active orders (pending/ready)
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

/* ===========================
   SLICE
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
  },
  reducers: {
    clearOrderMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    // Set singleOrder (used by socket handlers)
    setSingleOrder(state, action) {
      state.singleOrder = action.payload;
    },
    // Update or insert order into lists (userOrders, allOrders, activeOrders)
    upsertOrder(state, action) {
      const updated = action.payload;
      if (!updated || !updated._id) return;
      state.singleOrder = state.singleOrder && state.singleOrder._id === updated._id ? updated : state.singleOrder;
      state.userOrders = state.userOrders.map((o) => (o._id === updated._id ? updated : o));
      if (!state.userOrders.find((o) => o._id === updated._id) && updated.customerId) {
        state.userOrders.push(updated);
      }
      state.allOrders = state.allOrders.map((o) => (o._id === updated._id ? updated : o));
      if (!state.allOrders.find((o) => o._id === updated._id)) {
        state.allOrders.push(updated);
      }
      state.activeOrders = state.activeOrders.map((o) => (o._id === updated._id ? updated : o));
      if (updated.status && ["pending", "confirmed", "preparing", "ready"].includes(updated.status) && !state.activeOrders.find((o) => o._id === updated._id)) {
        state.activeOrders.push(updated);
      }
    },
    clearSingleOrder(state) {
      state.singleOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE ORDER FROM CART
      .addCase(createOrderFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
    // In orderSlice.js, update the createOrderFromCart.fulfilled case:
.addCase(createOrderFromCart.fulfilled, (state, action) => {
  state.loading = false;
  
  // Handle the nested response structure
  const response = action.payload;
  if (response.success && response.data) {
    state.singleOrder = response.data;  // Extract data from response
  } else {
    state.singleOrder = response;  // Fallback
  }
  
  state.successMessage = "Order created successfully";
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
        state.singleOrder = unwrap(action.payload);
        state.successMessage = "Direct order created successfully";
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
        state.singleOrder = unwrap(action.payload);
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch order";
      })

      // FETCH USER ORDERS
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.userOrders = Array.isArray(unwrap(action.payload))
          ? unwrap(action.payload)
          : [];
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch user orders";
      })

      // CANCEL OWN ORDER
      .addCase(cancelOwnOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOwnOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.singleOrder = unwrap(action.payload);
        state.successMessage = "Order canceled successfully";
      })
      .addCase(cancelOwnOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to cancel order";
      })

      // DELETE ORDER (ADMIN/CASHIER)
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        const orderId = action.payload;
        // Remove from all order lists
        state.userOrders = state.userOrders.filter((o) => o._id !== orderId);
        state.allOrders = state.allOrders.filter((o) => o._id !== orderId);
        state.activeOrders = state.activeOrders.filter((o) => o._id !== orderId);
        if (state.singleOrder?._id === orderId) {
          state.singleOrder = null;
        }
        state.successMessage = "Order deleted successfully";
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete order";
      })

      // FETCH ALL ORDERS (ADMIN)
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.allOrders = Array.isArray(unwrap(action.payload))
          ? unwrap(action.payload)
          : [];
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch all orders";
      })

      // UPDATE ORDER STATUS (ADMIN)
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = unwrap(action.payload);
        state.successMessage = "Order status updated";

        if (updatedOrder?._id) {
          // update singleOrder if it matches
          if (state.singleOrder && state.singleOrder._id === updatedOrder._id) {
            state.singleOrder = updatedOrder;
          }
          // update in userOrders and allOrders
          state.userOrders = state.userOrders.map((o) =>
            o._id === updatedOrder._id ? updatedOrder : o
          );
          state.allOrders = state.allOrders.map((o) =>
            o._id === updatedOrder._id ? updatedOrder : o
          );
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update order status";
      })

      // FETCH ACTIVE ORDERS (KITCHEN/CASHIER)
      .addCase(fetchActiveOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.activeOrders = Array.isArray(unwrap(action.payload))
          ? unwrap(action.payload)
          : [];
      })
      .addCase(fetchActiveOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch active orders";
      });
  },
});

export const { clearOrderMessages, clearSingleOrder, setSingleOrder, upsertOrder } = orderSlice.actions;
export default orderSlice.reducer;
