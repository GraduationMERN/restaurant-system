import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

//fetch all categories
export const getAllCategories = createAsyncThunk(
  "categories/fetchAll",
  async () => {
    const res = await api.get("/api/categories");
    return res.data;
  }
);

//getCategoryById
export const getCategoryById = createAsyncThunk(
  "categories/fetchById",
  async (id) => {
    const res = await api.get(`/api/categories/${id}`);
    return res.data;
  }
);

//create category
export const addCategory = createAsyncThunk(
  "categories/create",
  async (data) => {
    const res = await api.post(`/api/categories`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
);

//update category
export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }) => {
    const res = await api.put(`/api/categories/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
);

//delete category
export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id) => {
    const res = await api.delete(`/api/categories/${id}`);
    return res.data;
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    list: [],
    single: null,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearMessage(state) {
      state.error = null;
      state.successMessage = null;
    },
    clearSingle(state) {
      state.single = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All categories
      .addCase(getAllCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(getAllCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getAllCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // getCategoryById
      .addCase(getCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.single = action.payload;
      })
      .addCase(getCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(getCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // create category
      .addCase(addCategory.fulfilled, (state, action) => {
        state.successMessage = "category created successfully";
        state.list.push(action.payload);
      })
      .addCase(addCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.successMessage = "category updated successfully";
        state.list = state.list.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
        state.single = action.payload;
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // delete category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.successMessage = "category deleted successfully";
        state.list = state.list.filter((p) => p._id !== action.payload._id);
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});
export const { clearMessage, clearSingle } = categorySlice.actions;
export default categorySlice.reducer;
