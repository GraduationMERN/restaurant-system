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
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders/user"); // backend uses auth session
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
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { status });
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
      });
  },
});

export const { clearOrderMessages, clearSingleOrder } = orderSlice.actions;
export default orderSlice.reducer;
