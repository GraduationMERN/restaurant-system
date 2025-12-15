import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchRecommendationsByProduct = createAsyncThunk(
  "recommendations/byProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/recommendations/by-product/${productId}`);
      const list = Array.isArray(res.data?.recommendations)
        ? res.data.recommendations
        : [];
      return { productId, list };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to load product recommendations";
      return rejectWithValue({ productId, message });
    }
  }
);

export const fetchRecommendationsForOrder = createAsyncThunk(
  "recommendations/byOrder",
  async (params, { rejectWithValue }) => {
    try {
      const limit = params?.limit;
      const res = await api.get(`/api/recommendations/by-order`, {
        params: { limit },
      });
      const raw = Array.isArray(res.data?.recommendations)
        ? res.data.recommendations
        : [];
      const list = raw
        .map((r) => {
          const pid =
            typeof r.productId === "string"
              ? r.productId
              : r.productId?._id?.toString() || "";
          return pid ? { ...r, productId: pid } : null;
        })
        .filter(Boolean);
      return { list };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to load cart recommendations";
      return rejectWithValue({ message });
    }
  }
);

const recommendationSlice = createSlice({
  name: "recommendations",
  initialState: {
    // تخزين التوصيات لكل منتج عشان لو العميل اتنقل بين المنتجات منعملش Fetch تاني
    byProduct: {},
    // توصيات الأوردر الحالي (قائمة واحدة)
    byOrder: { list: [], status: "idle", error: null },
  },
  reducers: {
    // ممكن تحتاج Reducer يفضي التوصيات لما العميل يضيف حاجة للكارت
    clearOrderRecommendations: (state) => {
      state.byOrder = { list: [], status: "idle", error: null };
    }
  },
  extraReducers: (builder) => {
    builder
      // --- By Product ---
      .addCase(fetchRecommendationsByProduct.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!state.byProduct[productId]) {
          state.byProduct[productId] = { list: [], status: "loading", error: null };
        } else {
          state.byProduct[productId].status = "loading";
        }
      })
      .addCase(fetchRecommendationsByProduct.fulfilled, (state, action) => {
        const { productId, list } = action.payload;
        state.byProduct[productId] = {
          list, // [{ productId: "...", reason: "...", confidence: 0.95 }]
          status: "succeeded",
          error: null,
        };
      })
      .addCase(fetchRecommendationsByProduct.rejected, (state, action) => {
        const productId = action.meta.arg;
        const { message } = action.payload || {};
        state.byProduct[productId] = {
          list: [],
          status: "failed",
          error: message || "Failed to load",
        };
      })

      // --- By Order (Cart) ---
      .addCase(fetchRecommendationsForOrder.pending, (state) => {
        state.byOrder.status = "loading";
        state.byOrder.error = null;
      })
      .addCase(fetchRecommendationsForOrder.fulfilled, (state, action) => {
        state.byOrder.status = "succeeded";
        // القائمة دي بتحتوي على ID والسبب، هتحتاج تعمل Join مع المنتجات في الفرونت
        state.byOrder.list = action.payload.list;
      })
      .addCase(fetchRecommendationsForOrder.rejected, (state, action) => {
        state.byOrder.status = "failed";
        state.byOrder.error = action.payload?.message || "Error loading recommendations";
      });
  },
});

export const { clearOrderRecommendations } = recommendationSlice.actions;

// Selectors
export const selectRecommendationsForProduct = (state, productId) =>
  state.recommendations?.byProduct?.[productId]?.list || [];

export const selectRecommendationsStatus = (state, productId) =>
  state.recommendations?.byProduct?.[productId]?.status || "idle";

export const selectRecommendationsError = (state, productId) =>
  state.recommendations?.byProduct?.[productId]?.error || "";

export const selectOrderRecommendations = (state) =>
  state.recommendations?.byOrder?.list || [];

export const selectOrderRecommendationsStatus = (state) =>
  state.recommendations?.byOrder?.status || "idle";

export const selectOrderRecommendationsError = (state) =>
  state.recommendations?.byOrder?.error || "";

export default recommendationSlice.reducer;
