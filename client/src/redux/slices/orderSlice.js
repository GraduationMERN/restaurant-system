// src/redux/slices/orderSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

/**
 * Helper to normalize backend response.
 * Some endpoints return { success: true, data: ... } while others may return raw.
 */
const unwrap = (payload) => {
  if (!payload) return payload;
  return payload.data ?? payload;
};

/* ===========================
   THUNKS (async API calls)
   =========================== */

/**
 * Create order from cart (checkout flow)
 * POST /api/orders/from-cart
 */
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

/**
 * Create direct order (kiosk / direct)
 * POST /api/orders/direct
 */
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

/**
 * Fetch single order by id (tracking)
 */
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

/**
 * Fetch order by cart id
 */
export const fetchOrderByCartId = createAsyncThunk(
  "order/fetchByCartId",
  async (cartId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/orders/cart/${cartId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/**
 * Fetch orders for a specific user
 */
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/orders/user/${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/**
 * Cancel own order (customer)
 */
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

/**
 * Admin: fetch all orders
 */
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

/**
 * Admin: update order status
 * PATCH /api/orders/:id/status  body: { status }
 */
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
    userOrders: [],     // orders for the logged in user
    allOrders: [],      // admin: all orders
    activeOrders: [],   // kitchen: active orders
    singleOrder: null,  // the created / currently-tracked order
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
      /* ---------------------------
         CREATE ORDER FROM CART
      --------------------------- */
      .addCase(createOrderFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrderFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.singleOrder = unwrap(action.payload);
        state.successMessage = "Order created successfully";
      })
      .addCase(createOrderFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create order";
      })

      /* ---------------------------
         CREATE DIRECT ORDER
      --------------------------- */
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

      /* ---------------------------
         FETCH ORDER BY ID
      --------------------------- */
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

      /* ---------------------------
         FETCH ORDER BY CART ID
      --------------------------- */
      .addCase(fetchOrderByCartId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderByCartId.fulfilled, (state, action) => {
        state.loading = false;
        state.singleOrder = unwrap(action.payload);
      })
      .addCase(fetchOrderByCartId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch order by cart";
      })

      /* ---------------------------
         FETCH USER ORDERS
      --------------------------- */
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        const data = unwrap(action.payload);
        state.userOrders = Array.isArray(data) ? data : [];
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch user orders";
      })

      /* ---------------------------
         CANCEL OWN ORDER
      --------------------------- */
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

      /* ---------------------------
         FETCH ALL ORDERS (ADMIN)
      --------------------------- */
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        const data = unwrap(action.payload);
        state.allOrders = Array.isArray(data) ? data : [];
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch all orders";
      })

      /* ---------------------------
         UPDATE ORDER STATUS (ADMIN)
      --------------------------- */
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const data = unwrap(action.payload);
        state.successMessage = "Order status updated";

        if (data && data._id) {
          if (state.singleOrder && String(state.singleOrder._id) === String(data._id)) {
            state.singleOrder = data;
          }
          state.allOrders = state.allOrders?.map((o) =>
            String(o._id) === String(data._id) ? data : o
          ) ?? [];
          state.userOrders = state.userOrders?.map((o) =>
            String(o._id) === String(data._id) ? data : o
          ) ?? [];
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
