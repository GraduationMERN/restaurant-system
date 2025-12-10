// src/redux/slices/cartSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Get user or guest cart
export const getCartForUser = createAsyncThunk("cart/fetch", async () => {
  const res = await api.get("/api/cart");
  return res.data;
});

// Add product to cart (or update if exists)
export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ productId, quantity, selectedOptions }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/cart/add", {
        productId,
        quantity,
        selectedOptions,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);
// Add to cartSlice.js
export const updateCartItemOptions = createAsyncThunk(
  "cart/updateOptions",
  async ({ cartItemId, selectedOptions }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/cart/${cartItemId}/options`, { 
        selectedOptions 
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async ({ cartItemId, newQuantity }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/cart/${cartItemId}`, { newQuantity });
      return res.data;
    } catch (err) {
      // ✅ هنا بنرسل رسالة الخطأ من الباك للفِرونت
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const deleteProductFromCart = createAsyncThunk(
  "cart/deleteProduct",
  async (cartItemId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/api/cart/${cartItemId}`);
      return res.data;
    } catch (err) {
      // ✅ هنا بنرسل رسالة الخطأ من الباك للفِرونت
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Clear whole cart
export const clearCart = createAsyncThunk(
  "cart/clear",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.delete("/api/cart/clear/");
      return res.data;
    } catch (err) {
      // بجيب رسالة الخطأ من response.data لو موجودة، أو fallback على err.message
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
); 

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [],
    totalPrice: 0,
    loading: false,
    error: null,
    successMessage: null,
    _id: null,
  },
  reducers: {
    clearAlerts(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getCartForUser
      .addCase(getCartForUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCartForUser.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload?.products || [];
        state.totalPrice = action.payload?.totalPrice || 0;
        state._id = action.payload?._id || null;
      })
      .addCase(getCartForUser.rejected, (state, action) => {
        state.loading = false;
        state.error = state.error =
          action.payload?.message ||
          action.error?.message ||
          "Something went wrong";
      })

      // addToCart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPrice = action.payload.totalPrice;
        state.successMessage = "Added to cart successfully";
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = state.error =
          action.payload?.message ||
          action.error?.message ||
          "Something went wrong";
      })

      // deleteProductFromCart
      .addCase(deleteProductFromCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProductFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPrice = action.payload.totalPrice;
        state.successMessage = "Item removed";
      })
      .addCase(deleteProductFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = state.error =
          action.payload?.message ||
          action.error?.message ||
          "Something went wrong";
      })

      // updateCartQuantity
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Something went wrong";
      })

      // clearCart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.products = [];
        state.totalPrice = 0;
        state.successMessage = "Cart cleared";
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = state.error =
          action.payload?.message ||
          action.error?.message ||
          "Something went wrong";
      });
  },
});

export const { clearAlerts } = cartSlice.actions;
export default cartSlice.reducer;
