import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

//  Get user or guest cart
export const getCartForUser = createAsyncThunk("cart/fetch", async () => {
  const res = await api.get("/api/cart");
  return res.data;
});

// Add product to cart
export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ productId, quantity, selectedOptions }) => {
    const res = await api.post("/api/cart/add", {
      productId,
      quantity,
      selectedOptions,
    });
    return res.data;
  }
);

// Remove product from cart
export const deleteProductFromCart = createAsyncThunk(
  "cart/remove",
  async (productId) => {
    const res = await api.delete(`/api/cart/${productId}`);
    return res.data.cart;
  }
);

//  Update quantity of item
export const updateCartQuantity = createAsyncThunk(
  "cart/updateQty",
  async ({ productId, newQuantity }) => {
    const res = await api.put(`/api/cart/${productId}`, { newQuantity });
    return res.data.cart;
  }
);

//  Clear whole cart
export const clearCart = createAsyncThunk("cart/clear", async () => {
  const res = await api.delete("/api/cart/clear");
  return res.data.cart;
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [],
    totalPrice: 0,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearAlerts(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      //getCartForUser
      .addCase(getCartForUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCartForUser.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload?.products || [];
        state.totalPrice = action.payload?.totalPrice || 0;
      })
      .addCase(getCartForUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      //addToCart
      .addCase(addToCart.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.totalPrice = action.payload.totalPrice;
        state.successMessage = "Added to cart successfully";
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      //Remove Product
      .addCase(deleteProductFromCart.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.totalPrice = action.payload.totalPrice;
        state.successMessage = "Item removed";
      })
      .addCase(deleteProductFromCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProductFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update quantity
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      ///Clear Cart
      .addCase(clearCart.fulfilled, (state, action) => {
        state.products = [];
        state.totalPrice = 0;
        state.successMessage = "Cart cleared";
      })
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearAlerts } = cartSlice.actions;
export default cartSlice.reducer;
