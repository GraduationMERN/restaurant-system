import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    auth: authReducer,
  },
});
