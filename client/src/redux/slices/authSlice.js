import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// --- THUNKS ---

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("api/auth/register", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Registration failed"
      );
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await dispatch(getMe());

      if (res.meta.requestStatus === "rejected") {
        return rejectWithValue("Failed to login with Google");
      }

      return res.payload;
    } catch (err) {
      return rejectWithValue("Google login failed");
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp: code }, { rejectWithValue }) => {
    try {
      const res = await api.post("api/auth/verifyOtp", { email, code });
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
  async ({ email, password,points }, { rejectWithValue }) => {
    try {
      const res = await api.post("api/auth/login", { email, password,points });
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
      const res = await api.get("api/auth/me");
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) return rejectWithValue("Unauthorized");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// --- FORGOT PASSWORD ---
export const sendResetEmail = createAsyncThunk(
  "auth/sendResetEmail",
  async (email, { rejectWithValue }) => {
    try {
      const res = await api.post("api/auth/forget", { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Error sending email"
      );
    }
  }
);

// --- RESET PASSWORD ---
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await api.post("api/auth/reset", { token, password });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Error resetting password"
      );
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("api/auth/refresh");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to refresh token"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("api/auth/logout");
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

  // Loading states for existing auth logic
  loadingRegister: false,
  loadingVerifyOtp: false,
  loadingLogin: false,
  loadingGetMe: false,
  loadingLogout: false,

  // Loading + response states for Forget/Reset flow
  loadingReset: false,
  loadingSendReset: false,

  message: "",
};

// --- SLICE ---
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.message = "";
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearMessage(state) {
      state.message = "";
    },
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.message = "";
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
        if (typeof window !== "undefined") {
          window.localStorage.setItem("hasSession", "true");
        }
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
        if (typeof window !== "undefined") {
          window.localStorage.setItem("hasSession", "true");
        }
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
        state.loadingGetMe = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("hasSession", "true");
        }
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loadingGetMe = false;
        state.user = null;
        state.isAuthenticated = false;
        if (action.payload !== "Unauthorized") {
          state.error = action.payload;
        }
      });

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
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("hasSession");
        }
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loadingLogout = false;
        state.error = action.payload;
      });

    // --- SEND RESET EMAIL ---
    builder
      .addCase(sendResetEmail.pending, (state) => {
        state.loadingSendReset = true;
        state.error = null;
        state.message = "";
      })
      .addCase(sendResetEmail.fulfilled, (state) => {
        state.loadingSendReset = false;
        state.message = "Reset link sent to your email";
      })
      .addCase(sendResetEmail.rejected, (state, action) => {
        state.loadingSendReset = false;
        state.error = action.payload;
      });

    // --- RESET PASSWORD ---
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loadingReset = true;
        state.error = null;
        state.message = "";
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loadingReset = false;
        state.message = "Password reset successful";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loadingReset = false;
        state.error = action.payload;
      })
      .addCase(refreshToken.pending, (state) => {
        state.loadingRefresh = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loadingRefresh = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loadingRefresh = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMessage, setUser, logout, clearAuthState } =
  authSlice.actions;
export default authSlice.reducer;