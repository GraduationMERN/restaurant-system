import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

const unwrap = (payload) => payload?.data ?? payload ?? null;

export const fetchCashierOrders = createAsyncThunk(
  "cashier/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

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

export const cashierUpdateStatus = createAsyncThunk(
  "cashier/updateStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { status });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const cashierMarkPayment = createAsyncThunk(
  "cashier/markPayment",
  async ({ orderId, paymentMethod = "cash" }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/payment`, { paymentMethod });
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
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearCashierMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCashierOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashierOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(unwrap(action.payload)) ? unwrap(action.payload) : [];
      })
      .addCase(fetchCashierOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch orders";
      })

      .addCase(createDirectOrderCashier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDirectOrderCashier.fulfilled, (state, action) => {
        state.loading = false;
        const created = unwrap(action.payload);
        state.successMessage = "Direct order created";
        if (created) state.orders.unshift(created);
      })
      .addCase(createDirectOrderCashier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create direct order";
      })

      .addCase(cashierUpdateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cashierUpdateStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = unwrap(action.payload);
        state.successMessage = "Order status updated";
        if (updated?._id) {
          state.orders = state.orders.map((o) => (o._id === updated._id ? updated : o));
        }
      })
      .addCase(cashierUpdateStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update status";
      })

      .addCase(cashierMarkPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cashierMarkPayment.fulfilled, (state, action) => {
        state.loading = false;
        const updated = unwrap(action.payload);
        state.successMessage = "Payment marked";
        if (updated?._id) {
          state.orders = state.orders.map((o) => (o._id === updated._id ? updated : o));
        }
      })
      .addCase(cashierMarkPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to mark payment";
      });
  },
});

export const { clearCashierMessages } = cashierSlice.actions;
export default cashierSlice.reducer;
