import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Fetch user profile
export const fetchUserProfile = createAsyncThunk(
  "userProfile/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/user-profile");
      return res.data.profile;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch profile");
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  "userProfile/updateProfile",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.put("/api/user-profile", data);
      return res.data.profile;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile");
    }
  }
);

// Upload avatar
export const uploadUserAvatar = createAsyncThunk(
  "userProfile/uploadAvatar",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/api/user-profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.profile;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to upload avatar");
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  error: null,
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      // Upload avatar
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { clearProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
