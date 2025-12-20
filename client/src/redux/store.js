import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
import authReducer from "./slices/authSlice";
import usersReducer from "./slices/usersSlice";
import productReducer from "./slices/ProductSlice";
import categoryReducer from "./slices/CategorySlice";
import cartReducer from "./slices/cartSlice";
import reviewReducer from "./slices/reviewSlice";
import chatbotReducer from "./slices/chatbotSlice";
import orderReducer from "./slices/orderSlice";
import ordersReducer from "./slices/ordersSlice";
import paymentReducer from "./slices/paymentSlice";
import kitchenReducer from "./slices/kitchenSlice";
import cashierReducer from "./slices/cashierSlice";
import rewardOrderReducer from "./slices/rewardOrderSlice";
import recommendationReducer from "./slices/recommendationSlice";
import aiProductReducer from "./slices/aiProductSlice";
import userProfileReducer from "./slices/userProfileSlice";
import searchReducer from "./slices/searchSlice";
import staffChatReducer from "./slices/staffChatSlice";

export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    rewardOrders: rewardOrderReducer,
    auth: authReducer,
    users: usersReducer,
    product: productReducer,
    category: categoryReducer,
    cart: cartReducer,
    reviews: reviewReducer,
    chatbot: chatbotReducer,
    order: orderReducer,
    orders: ordersReducer,
    payment: paymentReducer,
    kitchen: kitchenReducer,
    cashier: cashierReducer,
    recommendations: recommendationReducer,
    aiProduct: aiProductReducer,
    userProfile: userProfileReducer,
    search: searchReducer,
    staffChat: staffChatReducer,
  },
});
