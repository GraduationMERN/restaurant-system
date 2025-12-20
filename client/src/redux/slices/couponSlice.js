// couponSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ========== ADMIN THUNKS ==========

// Get all coupons (Admin)
export const getAllCoupons = createAsyncThunk(
  "coupon/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/coupons/admin/coupons");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch coupons");
    }
  }
);

// Create coupon (Admin)
export const createCoupon = createAsyncThunk(
  "coupon/create",
  async (couponData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/coupons/admin/coupons", couponData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create coupon");
    }
  }
);

// Update coupon (Admin)
export const updateCoupon = createAsyncThunk(
  "coupon/update",
  async ({ couponId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/coupons/admin/coupons/${couponId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update coupon");
    }
  }
);

// Delete coupon (Admin)
export const deleteCoupon = createAsyncThunk(
  "coupon/delete",
  async (couponId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/coupons/admin/coupons/${couponId}`);
      return couponId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete coupon");
    }
  }
);

// ========== CUSTOMER THUNKS ==========

// Validate coupon by code (simple validation for checkout page)
export const validateCouponByCode = createAsyncThunk(
  "coupon/validateByCode",
  async (code, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/coupons/validate/${code}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Invalid coupon code");
    }
  }
);

// Validate coupon with full order details
export const validateCoupon = createAsyncThunk(
  "coupon/validate",
  async ({ code, orderId }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/coupons/validate", { code, orderId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Coupon validation failed");
    }
  }
);

// Apply coupon to order
export const applyCoupon = createAsyncThunk(
  "coupon/apply",
  async ({ code, orderId }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/coupons/apply", { code, orderId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to apply coupon");
    }
  }
);

// ========== SLICE ==========

const couponSlice = createSlice({
  name: "coupon",
  initialState: {
    // Admin
    allCoupons: [],
    
    // Customer
    validatedCoupon: null,
    appliedCoupon: null,
    
    // UI State
    loading: false,
    validating: false,
    applying: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearCouponMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearValidatedCoupon: (state) => {
      state.validatedCoupon = null;
    },
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null;
    },
    resetCouponState: (state) => {
      state.validatedCoupon = null;
      state.appliedCoupon = null;
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ========== GET ALL COUPONS (ADMIN) ==========
      .addCase(getAllCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.allCoupons = action.payload.coupons || [];
      })
      .addCase(getAllCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== CREATE COUPON (ADMIN) ==========
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.allCoupons.push(action.payload.coupon);
        state.successMessage = action.payload.message;
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== UPDATE COUPON (ADMIN) ==========
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.coupon;
        state.allCoupons = state.allCoupons.map(c => 
          c._id === updated._id ? updated : c
        );
        state.successMessage = action.payload.message;
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== DELETE COUPON (ADMIN) ==========
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.allCoupons = state.allCoupons.filter(c => c._id !== action.payload);
        state.successMessage = "Coupon deleted successfully";
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== VALIDATE COUPON BY CODE ==========
      .addCase(validateCouponByCode.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateCouponByCode.fulfilled, (state, action) => {
        state.validating = false;
        state.validatedCoupon = action.payload.coupon;
        state.successMessage = action.payload.message;
      })
      .addCase(validateCouponByCode.rejected, (state, action) => {
        state.validating = false;
        state.validatedCoupon = null;
        state.error = action.payload;
      })

      // ========== VALIDATE COUPON (FULL) ==========
      .addCase(validateCoupon.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.validating = false;
        state.validatedCoupon = action.payload.data;
        state.successMessage = action.payload.message;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.validating = false;
        state.validatedCoupon = null;
        state.error = action.payload;
      })

      // ========== APPLY COUPON ==========
      .addCase(applyCoupon.pending, (state) => {
        state.applying = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.applying = false;
        state.appliedCoupon = action.payload.data;
        state.successMessage = action.payload.message;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.applying = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCouponMessages,
  clearValidatedCoupon,
  clearAppliedCoupon,
  resetCouponState
} = couponSlice.actions;

export default couponSlice.reducer;