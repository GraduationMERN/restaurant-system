import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// --- THUNKS ---

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      console.log(payload);
      const res = await api.post("/auth/register", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Registration failed"
      );
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp: code }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/verifyOtp", { email, code });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Login failed"
      );
    }
  }
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) return rejectWithValue("Unauthorized");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// export const refreshToken = createAsyncThunk(
//   "auth/refreshToken",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await api.post("/auth/refresh");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Could not refresh token"
//       );
//     }
//   }
// );

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// --- INITIAL STATE ---
const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,

  loadingRegister: false,
  loadingVerifyOtp: false,
  loadingLogin: false,
  loadingGetMe: false,
  loadingRefresh: false,
  loadingLogout: false,
};

// --- SLICE ---
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- REGISTER ---
    builder
      .addCase(registerUser.pending, (state) => {
        state.loadingRegister = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loadingRegister = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loadingRegister = false;
        state.error = action.payload || "Registration failed";
      });

    // --- VERIFY OTP ---
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loadingVerifyOtp = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loadingVerifyOtp = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loadingVerifyOtp = false;
        state.error = action.payload;
      });

    // --- LOGIN ---
    builder
      .addCase(loginUser.pending, (state) => {
        state.loadingLogin = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loadingLogin = false;
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loadingLogin = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      });

    // --- GET ME ---
    builder
      .addCase(getMe.pending, (state) => {
        state.loadingGetMe = true;
        state.error = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        console.log("fulfilled");
        state.loadingGetMe = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state, action) => {
        console.log("rejected");

        state.loadingGetMe = false;
        state.user = null;
        state.isAuthenticated = false;
        if (action.payload && action.payload !== "Unauthorized") {
          state.error = action.payload;
        }
      });

    // --- REFRESH TOKEN ---
    // builder
    //   .addCase(refreshToken.pending, (state) => {
    //     state.loadingRefresh = true;
    //     state.error = null;
    //   })
    //   .addCase(refreshToken.fulfilled, (state, action) => {
    //     state.loadingRefresh = false;
    //     if (action.payload?.user) {
    //       state.user = action.payload.user;
    //       state.isAuthenticated = true;
    //     }
    //     state.error = null;
    //   })
    //   .addCase(refreshToken.rejected, (state, action) => {
    //     state.loadingRefresh = false;
    //     state.user = null;
    //     state.isAuthenticated = false;
    //     if (action.payload && action.payload !== "Unauthorized") {
    //       state.error = action.payload;
    //     }
    //   });

    // --- LOGOUT ---
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loadingLogout = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loadingLogout = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loadingLogout = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
