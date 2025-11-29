import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
export const store = configureStore({
  reducer: {
    reward: rewardReducer,
  },
});
