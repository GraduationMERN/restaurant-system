import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
import authReducer from "./slices/authSlice";
import reviewReducer from "./slices/reviewSlice";
export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    auth: authReducer,
    reviews: reviewReducer,
  },
});
