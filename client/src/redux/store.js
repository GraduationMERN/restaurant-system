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
import kitchenReducer from "./slices/kitchenSlice";
import cashierReducer from "./slices/cashierSlice";

import rewardOrderReducer from "./slices/rewardOrderSlice";


export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    rewardOrders: rewardOrderReducer,
    auth: authReducer,
    product: productReducer,
    category: categoryReducer,
    cart: cartReducer,
    reviews: reviewReducer,
    chatbot: chatbotReducer,
    order: orderReducer,
    payment: paymentReducer,
    kitchen: kitchenReducer,
    cashier: cashierReducer,
  },
});