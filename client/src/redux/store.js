import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/ProductSlice";
import categoryReducer from "./slices/CategorySlice";
import cartReducer from "./slices/cartSlice";
import reviewReducer from "./slices/reviewSlice";
import chatbotReducer from "./slices/chatbotSlice";
import orderReducer from "./slices/orderSlice";
import paymentReducer from "./slices/paymentSlice";



export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    auth: authReducer,
    product: productReducer,
    category: categoryReducer,
    cart: cartReducer,
    reviews: reviewReducer,
    chatbot: chatbotReducer,
    order: orderReducer,
    payment: paymentReducer,
  },
});