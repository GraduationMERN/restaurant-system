import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
import rewardOrdersReducer from "./slices/rewardOrderSlice";
export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    rewardOrders: rewardOrdersReducer,
  },
});
