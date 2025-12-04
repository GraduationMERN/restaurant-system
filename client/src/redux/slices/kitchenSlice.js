import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

const unwrap = (payload) => payload?.data ?? payload ?? null;

export const fetchKitchenActive = createAsyncThunk(
  "kitchen/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders/kitchen/active");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const changeOrderStatus = createAsyncThunk(
  "kitchen/changeStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { status });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const kitchenSlice = createSlice({
  name: "kitchen",
  initialState: {
    activeOrders: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearKitchenMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKitchenActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKitchenActive.fulfilled, (state, action) => {
        state.loading = false;
        state.activeOrders = Array.isArray(unwrap(action.payload)) ? unwrap(action.payload) : [];
      })
      .addCase(fetchKitchenActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch active orders";
      })

      .addCase(changeOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Order status updated";
        const updated = unwrap(action.payload);
        if (updated?._id) {
          state.activeOrders = state.activeOrders.map((o) => (o._id === updated._id ? updated : o));
        }
      })
      .addCase(changeOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update order status";
      });
  },
});

export const { clearKitchenMessages } = kitchenSlice.actions;
export default kitchenSlice.reducer;
