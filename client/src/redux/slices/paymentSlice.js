// src/redux/slices/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ===========================
// THUNKS
// ===========================

// Online Stripe payment
export const createStripeSession = createAsyncThunk(
  "payment/createStripeSession",
  async ({ orderId }, { rejectWithValue }) => {
    try {
      // Changed from /api/payment/checkout to /api/checkout/create
      const res = await api.post(`/api/checkout/create`, { orderId });
      return res.data; // expects Stripe session object
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// In-store / Cashier payment
export const payInStore = createAsyncThunk(
  "payment/payInStore",
  async ({ orderId }, { rejectWithValue }) => {
    try {
      // This should match your backend route
      const res = await api.post(`/api/orders/${orderId}/pay-instore`);
      return res.data; // expects updated order object
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ===========================
// SLICE
// ===========================
const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    loading: false,
    error: null,
    successMessage: null,
    stripeSession: null,
    order: null,
  },
  reducers: {
    clearPaymentState(state) {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
      state.stripeSession = null;
      state.order = null;
    },
  },
  extraReducers: (builder) => {
    // Stripe payment
    builder
      .addCase(createStripeSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStripeSession.fulfilled, (state, action) => {
        state.loading = false;
        state.stripeSession = action.payload;
      })
      .addCase(createStripeSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create Stripe session";
      });

    // In-store payment
    builder
      .addCase(payInStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(payInStore.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
        state.successMessage = "Order marked as pay-in-store successfully";
      })
      .addCase(payInStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to process in-store payment";
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;