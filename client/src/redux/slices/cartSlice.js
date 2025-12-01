import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

/* ==========================
   ASYNC THUNKS
   ========================== */

// Fetch cart for user/guest
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

// Remove product
export const deleteProductFromCart = createAsyncThunk(
  "cart/remove",
  async (productId) => {
    const res = await api.delete(`/api/cart/${productId}`);
    return res.data.cart;
  }
);

// Update quantity
export const updateCartQuantity = createAsyncThunk(
  "cart/updateQty",
  async ({ productId, newQuantity }) => {
    const res = await api.put(`/api/cart/${productId}`, { newQuantity });
    return res.data.cart;
  }
);

// Clear cart
export const clearCart = createAsyncThunk("cart/clear", async () => {
  const res = await api.delete("/api/cart/clear");
  return res.data.cart;
});

/* ==========================
   HELPER
   ========================== */
const calculateTotal = (products) => {
  return products.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

/* ==========================
   SLICE
   ========================== */
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [
      // Static items for testing
      {
        _id: "item1",
        productId: {
          _id: "prod1",
          name: "Cheeseburger",
          imgURL: "https://via.placeholder.com/150",
          price: 50,
          options: [],
        },
        quantity: 2,
        price: 50,
        selectedOptions: {},
      },
      {
        _id: "item2",
        productId: {
          _id: "prod2",
          name: "Coke",
          imgURL: "https://via.placeholder.com/150",
          price: 15,
          options: [],
        },
        quantity: 1,
        price: 15,
        selectedOptions: {},
      },
    ],
    totalPrice: 50 * 2 + 15 * 1, // 115
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
      // getCartForUser
      .addCase(getCartForUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCartForUser.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload?.products || [];
        state.totalPrice = calculateTotal(state.products);
      })
      .addCase(getCartForUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // addToCart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPrice = calculateTotal(state.products);
        state.successMessage = "Added to cart successfully";
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // deleteProductFromCart
      .addCase(deleteProductFromCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProductFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPrice = calculateTotal(state.products);
        state.successMessage = "Item removed";
      })
      .addCase(deleteProductFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // updateCartQuantity
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPrice = calculateTotal(state.products);
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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
        state.error = action.error.message;
      });
  },
});

export const { clearAlerts } = cartSlice.actions;
export default cartSlice.reducer;
