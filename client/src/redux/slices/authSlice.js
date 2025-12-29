import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// --- THUNKS ---

export const firebaseLogin = createAsyncThunk(
  "auth/firebaseLogin",
  async (firebaseToken, { rejectWithValue }) => {
    try {
      const res = await api.post(
        "/api/auth/firebase-login",
        {},
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
          },
        }
      );
      // Store refresh token from server (fallback for dev where cookies may not be sent)
      if (typeof window !== "undefined" && res?.data?.refreshToken) {
        window.localStorage.setItem("refreshToken", res.data.refreshToken);
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/auth/me");
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) return rejectWithValue("Unauthorized");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// --- FORGOT PASSWORD ---
export const completeProfile = createAsyncThunk(
  "auth/complete-profile",
  async ({phoneNumber,name}, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/auth/complete-profile", { phoneNumber,name });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Error sending email"
      );
    }
  }
);


export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      // Try cookie-based refresh first; if not available, fall back to stored refresh token
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("refreshToken") : null;
      const headers = stored ? { Authorization: `Bearer ${stored}` } : undefined;
      const res = await api.post("/api/auth/refresh", {}, { headers });
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
      await api.post("/api/auth/logout");
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
    // --- LOGIN ---
    builder
      .addCase(firebaseLogin.pending, (state) => {
        state.loadingLogin = true;
        state.error = null;
      })
      .addCase(firebaseLogin.fulfilled, (state, action) => {
        state.loadingLogin = false;
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("hasSession", "true");
        }
        // Set axios Authorization header for immediate authenticated requests
        try {
          const access = action.payload?.accessToken;
          if (access) {
            api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
            if (typeof window !== "undefined") window.localStorage.setItem("accessToken", access);
          }
        } catch (e) {
          // ignore
        }
      })
      .addCase(firebaseLogin.rejected, (state, action) => {
        state.loadingLogin = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      });
       builder
      .addCase(completeProfile.pending, (state) => {
        state.loadingLogin = true;
        state.error = null;
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        state.loadingLogin = false;
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("hasSession", "true");
        }
      })
      .addCase(completeProfile.rejected, (state, action) => {
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
          window.localStorage.removeItem("refreshToken");
          window.localStorage.removeItem("accessToken");
        }
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loadingLogout = false;
        state.error = action.payload;
      });

    builder
      .addCase(refreshToken.pending, (state) => {
        state.loadingRefresh = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loadingRefresh = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        try {
          const access = action.payload?.accessToken;
          if (access) {
            api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
            if (typeof window !== "undefined") window.localStorage.setItem("accessToken", access);
          }
        } catch (e) {
          // ignore
        }
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