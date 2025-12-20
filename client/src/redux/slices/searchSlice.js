import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

/**
 * Smart Search Redux Slice
 * Handles semantic search with "Did you mean?" suggestions
 */

// Async Thunks

/**
 * Full semantic search with suggestions
 */
export const semanticSearch = createAsyncThunk(
  "search/semantic",
  async ({ query, limit = 10, lang = "en" }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/search", { query, limit, lang });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Search failed"
      );
    }
  }
);

/**
 * Quick autocomplete search
 */
export const quickSearch = createAsyncThunk(
  "search/quick",
  async ({ query, limit = 5 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/search/quick?q=${encodeURIComponent(query)}&limit=${limit}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Quick search failed"
      );
    }
  }
);

/**
 * Image-based search
 * Uploads image and gets matching products
 */
export const imageSearch = createAsyncThunk(
  "search/image",
  async ({ imageFile, limit = 10, lang = "en" }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("limit", limit);
      formData.append("lang", lang);
      
      const res = await api.post("/api/search/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Image search failed"
      );
    }
  }
);

// Slice
const searchSlice = createSlice({
  name: "search",
  initialState: {
    query: "",
    results: [],
    suggestions: [],
    quickResults: [],
    isSearching: false,
    isQuickSearching: false,
    isImageSearching: false,
    error: null,
    totalResults: 0,
    lastSearchedQuery: "",
    // Image search specific
    imageDescription: null,
    searchedImageUrl: null,
  },
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    clearSearch(state) {
      state.query = "";
      state.results = [];
      state.suggestions = [];
      state.quickResults = [];
      state.error = null;
      state.totalResults = 0;
      state.lastSearchedQuery = "";
      state.imageDescription = null;
      state.searchedImageUrl = null;
    },
    clearSuggestions(state) {
      state.suggestions = [];
    },
    clearQuickResults(state) {
      state.quickResults = [];
    },
    clearImageSearch(state) {
      state.imageDescription = null;
      state.searchedImageUrl = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Semantic Search
      .addCase(semanticSearch.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(semanticSearch.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.results || [];
        state.suggestions = action.payload.suggestions || [];
        state.totalResults = action.payload.totalResults || 0;
        state.lastSearchedQuery = action.payload.originalQuery || "";
      })
      .addCase(semanticSearch.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload || "Search failed";
      })

      // Quick Search
      .addCase(quickSearch.pending, (state) => {
        state.isQuickSearching = true;
      })
      .addCase(quickSearch.fulfilled, (state, action) => {
        state.isQuickSearching = false;
        state.quickResults = action.payload.results || [];
      })
      .addCase(quickSearch.rejected, (state, action) => {
        state.isQuickSearching = false;
        state.quickResults = [];
      })

      // Image Search
      .addCase(imageSearch.pending, (state) => {
        state.isImageSearching = true;
        state.isSearching = true;
        state.error = null;
      })
      .addCase(imageSearch.fulfilled, (state, action) => {
        state.isImageSearching = false;
        state.isSearching = false;
        state.results = action.payload.results || [];
        state.totalResults = action.payload.totalResults || 0;
        state.imageDescription = action.payload.description || null;
        state.searchedImageUrl = action.payload.originalImageUrl || null;
        state.suggestions = []; // No suggestions for image search
      })
      .addCase(imageSearch.rejected, (state, action) => {
        state.isImageSearching = false;
        state.isSearching = false;
        state.error = action.payload || "Image search failed";
      });
  },
});

export const { setQuery, clearSearch, clearSuggestions, clearQuickResults, clearImageSearch } = searchSlice.actions;
export default searchSlice.reducer;

