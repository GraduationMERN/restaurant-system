import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Fetch all users
export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
  const res = await api.get("api/users/");
  return res.data.users;
});

// Update user role
export const updateUserRole = createAsyncThunk(
  "users/updateUserRole",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const res = await api.put(`api/users/${userId}/role`, { role });
      return { userId, role, user: res.data.user };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update role");
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    loading: false,
    error: null,
    updating: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH USERS
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load users";
      })
      // UPDATE USER ROLE
      .addCase(updateUserRole.pending, (state, action) => {
        state.updating = action.meta.arg.userId;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.updating = null;
        const { userId, role } = action.payload;
        const userIndex = state.users.findIndex(u => u._id === userId || u.id === userId);
        if (userIndex !== -1) {
          state.users[userIndex].role = role;
        }
      })
      .addCase(updateUserRole.rejected, (state) => {
        state.updating = null;
      });
  },
});

export default usersSlice.reducer;
