import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Fetch all reviews
export const fetchReviews = createAsyncThunk(
  "reviews/fetchReviews",
  async () => {
    const res = await api.get("/api/reviews");
    return res.data.reviews; // ensure this matches your backend
  }
);

// Create review with FormData
export const createReview = createAsyncThunk(
  "reviews/createReview",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/reviews", formData); // FormData directly
      return res.data.data; // return the created review
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createReview.pending, (state) => {
        state.loading = true;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.list) state.list = [];
        if (action.payload) state.list.unshift(action.payload); // safe unshift
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reviewSlice.reducer;
