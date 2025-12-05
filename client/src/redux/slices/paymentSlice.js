// paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ===========================
// THUNKS (UPDATED ENDPOINTS)
// ===========================

// Create Stripe checkout session
export const createStripeSession = createAsyncThunk(
  "payment/createStripeSession",
  async ({ orderId, paymentMethod = "card" }, { rejectWithValue }) => {
    try {
      console.log("Creating Stripe session for order:", orderId);
      
      const res = await api.post(`/api/checkout/create`, { orderId, paymentMethod });
      return res.data; // { success: true, url, sessionId, orderId }
    } catch (err) {
      console.error("Payment error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Process in-store payment (cashier)
export const payInStore = createAsyncThunk(
  "payment/payInStore",
  async ({ orderId }, { rejectWithValue }) => {
    try {
      // Fixed endpoint to match backend
      const res = await api.post(`/api/checkout/${orderId}/pay-instore`);
      return res.data;
    } catch (err) {
      console.error("Pay in store error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔥 NEW: Verify payment status by session ID
export const verifyPaymentStatus = createAsyncThunk(
  "payment/verifyStatus",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/checkout/session/${sessionId}/order`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔥 NEW: Process refund
export const processRefund = createAsyncThunk(
  "payment/processRefund",
  async ({ orderId, refundAmount }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/payment`, {
        paymentStatus: "refunded",
        refundAmount
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ===========================
// SLICE (UPDATED)
// ===========================
const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    loading: false,
    error: null,
    successMessage: null,
    stripeSession: null, // { url, sessionId, orderId }
    paymentStatus: null, // 'pending', 'processing', 'success', 'failed'
    verifiedOrder: null, // Order verified by session ID
  },
  reducers: {
    clearPaymentState(state) {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
      state.stripeSession = null;
      state.paymentStatus = null;
      state.verifiedOrder = null;
    },
    
    setPaymentStatus(state, action) {
      state.paymentStatus = action.payload;
    },
    
    // 🔥 NEW: Socket event handlers for payment updates
    socketPaymentSuccess(state, action) {
      const order = action.payload;
      state.paymentStatus = 'success';
      state.verifiedOrder = order;
      state.successMessage = `Payment successful for order ${order.orderNumber}`;
    },
    
    socketPaymentFailed(state, action) {
      state.paymentStatus = 'failed';
      state.error = action.payload?.message || "Payment failed";
    },
    
    socketPaymentRefunded(state, action) {
      const order = action.payload;
      state.paymentStatus = 'refunded';
      state.successMessage = `Refund processed for order ${order.orderNumber}`;
    }
  },
  extraReducers: (builder) => {
    // Stripe payment
    builder
      .addCase(createStripeSession.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.paymentStatus = 'processing';
      })
      .addCase(createStripeSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.stripeSession = action.payload;
          state.paymentStatus = 'redirecting';
        } else {
          state.error = action.payload.message;
          state.paymentStatus = 'failed';
        }
      })
      .addCase(createStripeSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create Stripe session";
        state.paymentStatus = 'failed';
      })

    // In-store payment
    builder
      .addCase(payInStore.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.paymentStatus = 'processing';
      })
      .addCase(payInStore.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.verifiedOrder = action.payload.data;
          state.paymentStatus = 'success';
          state.successMessage = "Order marked as paid in-store";
        } else {
          state.error = action.payload.message;
          state.paymentStatus = 'failed';
        }
      })
      .addCase(payInStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to process in-store payment";
        state.paymentStatus = 'failed';
      })

    // Verify payment status
    builder
      .addCase(verifyPaymentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPaymentStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.verifiedOrder = action.payload.data;
          state.paymentStatus = state.verifiedOrder.paymentStatus;
          
          if (state.verifiedOrder.paymentStatus === 'paid') {
            state.successMessage = "Payment verified successfully";
          }
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(verifyPaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to verify payment";
      })

    // Process refund
    builder
      .addCase(processRefund.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.paymentStatus = 'refunded';
          state.successMessage = "Refund processed successfully";
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to process refund";
      });
  }
});

export const {
  clearPaymentState,
  setPaymentStatus,
  socketPaymentSuccess,
  socketPaymentFailed,
  socketPaymentRefunded
} = paymentSlice.actions;

export default paymentSlice.reducer;