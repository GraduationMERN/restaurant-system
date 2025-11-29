import { configureStore } from "@reduxjs/toolkit";
import rewardReducer from "./slices/rewardSlice";
import reviewReducer from "./slices/reviewSlice";
export const store = configureStore({
  reducer: {
    reward: rewardReducer,
    reviews: reviewReducer,
  },
});
