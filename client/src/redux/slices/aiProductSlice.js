import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const analyzeProductImage = createAsyncThunk(
  "aiProduct/analyze",
  async (file, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/api/ai-product/analyze-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const slice = createSlice({
  name: "aiProduct",
  initialState: {
    lastResult: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAiProduct(state) {
      state.lastResult = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeProductImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeProductImage.fulfilled, (state, action) => {
        state.loading = false;
        state.lastResult = action.payload || null;
      })
      .addCase(analyzeProductImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "AI analysis failed";
      });
  },
});

export const { clearAiProduct } = slice.actions;
export default slice.reducer;
