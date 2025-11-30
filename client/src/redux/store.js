import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
import productReducer from "./slices/ProductSlice"
import categoryReducer from"./slices/CategorySlice";
import cartReducer from"./slices/cartSlice";


export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    product:productReducer,
    category:categoryReducer,
    cart:cartReducer,
    reviews: reviewReducer,
  },
});
