import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Local storage helpers for customer bookings persistence
const CUSTOMER_BOOKINGS_KEY = "customerBookings";
function loadCustomerBookings() {
  try {
    const raw = localStorage.getItem(CUSTOMER_BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load customer bookings from localStorage", e);
    return [];
  }
}

function saveCustomerBookings(bookings) {
  try {
    localStorage.setItem(CUSTOMER_BOOKINGS_KEY, JSON.stringify(bookings || []));
  } catch (e) {
    console.warn("Failed to save customer bookings to localStorage", e);
  }
}

// Async thunks for booking API calls

export const createBooking = createAsyncThunk(
  "booking/createBooking",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/bookings", data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBookings = createAsyncThunk(
  "booking/fetchBookings",
  async ({ restaurantId, date }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ restaurantId });
      if (date) params.append("date", date);
      const response = await api.get(`/api/bookings?${params}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTodayBookings = createAsyncThunk(
  "booking/fetchTodayBookings",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/bookings/today?restaurantId=${restaurantId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchUpcomingBookings = createAsyncThunk(
  "booking/fetchUpcomingBookings",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/bookings/upcoming?restaurantId=${restaurantId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCustomerBookings = createAsyncThunk(
  "booking/fetchCustomerBookings",
  async ({ restaurantId, customerEmail }, { rejectWithValue }) => {
    try {
      console.log('🔗 [fetchCustomerBookings thunk] Calling API with:', { restaurantId, customerEmail });
      const response = await api.get(
        `/api/bookings/customer?restaurantId=${restaurantId}&customerEmail=${customerEmail}`
      );
      console.log('🔗 [fetchCustomerBookings thunk] API response status:', response.status);
      console.log('🔗 [fetchCustomerBookings thunk] Full response:', response);
      const data = response.data?.data || response.data || [];
      console.log('🔗 [fetchCustomerBookings thunk] Extracted data:', data, '| Length:', Array.isArray(data) ? data.length : 'not array');
      return data;
    } catch (error) {
      console.error('🔗 [fetchCustomerBookings thunk] Error occurred:', error);
      console.error('🔗 [fetchCustomerBookings thunk] Error message:', error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  "booking/fetchBookingById",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Workflow actions - Cashier only
export const confirmBooking = createAsyncThunk(
  "booking/confirmBooking",
  async ({ bookingId, tableIds }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/confirm`, { tableIds });
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejectBooking = createAsyncThunk(
  "booking/rejectBooking",
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/reject`, { reason });
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markSeated = createAsyncThunk(
  "booking/markSeated",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/bookings/${bookingId}/seated`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const completeBooking = createAsyncThunk(
  "booking/completeBooking",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/bookings/${bookingId}/complete`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markNoShow = createAsyncThunk(
  "booking/markNoShow",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/bookings/${bookingId}/no-show`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  "booking/cancelBooking",
  async ({ bookingId, customerEmail }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/api/bookings/${bookingId}?customerEmail=${customerEmail}`
      );
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getBookingAnalytics = createAsyncThunk(
  "booking/getAnalytics",
  async ({ restaurantId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/bookings/analytics?restaurantId=${restaurantId}&startDate=${startDate}&endDate=${endDate}`
      );
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  // Lists
  bookings: [],
  todayBookings: [],
  upcomingBookings: [],
  customerBookings: loadCustomerBookings(),
  
  // Detail
  selectedBooking: null,
  
  // Analytics
  analytics: null,
  
  // UI
  loading: false,
  error: null,
  success: false,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    // Update booking from WebSocket event
    updateBookingFromSocket: (state, action) => {
      const updatedBooking = action.payload;
      
      // Update in all lists
      state.bookings = state.bookings.map(b =>
        b._id === updatedBooking._id ? updatedBooking : b
      );
      state.todayBookings = state.todayBookings.map(b =>
        b._id === updatedBooking._id ? updatedBooking : b
      );
      state.upcomingBookings = state.upcomingBookings.map(b =>
        b._id === updatedBooking._id ? updatedBooking : b
      );
      state.customerBookings = state.customerBookings.map(b =>
        b._id === updatedBooking._id ? updatedBooking : b
      );
      
      // Update selected if it's the same
      if (state.selectedBooking?._id === updatedBooking._id) {
        state.selectedBooking = updatedBooking;
      }
      // persist customer bookings after updates
      try {
        saveCustomerBookings(state.customerBookings);
      } catch (e) {
        // no-op (save helper already logs)
      }
    },
    
    // Add new booking from WebSocket
    addBookingFromSocket: (state, action) => {
      const newBooking = action.payload;
      // Add to customerBookings if not already there
      if (!state.customerBookings.find(b => b._id === newBooking._id)) {
        state.customerBookings.unshift(newBooking);
      }
      // Also add to general bookings list
      if (!state.bookings.find(b => b._id === newBooking._id)) {
        state.bookings.unshift(newBooking);
      }
      // persist customer bookings
      try {
        saveCustomerBookings(state.customerBookings);
      } catch (e) {
        // no-op
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    clearSuccess: (state) => {
      state.success = false;
    },
    
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    // Create Booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.bookings.unshift(action.payload);
        state.customerBookings.unshift(action.payload);
        // persist customer bookings
        saveCustomerBookings(state.customerBookings);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Bookings
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Today's Bookings
    builder
      .addCase(fetchTodayBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodayBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.todayBookings = action.payload;
      })
      .addCase(fetchTodayBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Upcoming Bookings
    builder
      .addCase(fetchUpcomingBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUpcomingBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingBookings = action.payload;
      })
      .addCase(fetchUpcomingBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Customer Bookings
    builder
      .addCase(fetchCustomerBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerBookings.fulfilled, (state, action) => {
        state.loading = false;
        const fetched = Array.isArray(action.payload) ? action.payload : [];
        // If server returned empty but we already have persisted bookings, avoid overwriting
        if (fetched.length === 0 && state.customerBookings && state.customerBookings.length > 0) {
          // keep existing persisted bookings
        } else {
          state.customerBookings = fetched;
          // persist fetched customer bookings
          try {
            saveCustomerBookings(state.customerBookings);
          } catch (e) {
            // no-op
          }
        }
      })
      .addCase(fetchCustomerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Booking By ID
    builder
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Confirm Booking
    builder
      .addCase(confirmBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update in all lists
        const updated = action.payload;
        state.bookings = state.bookings.map(b => b._id === updated._id ? updated : b);
        state.todayBookings = state.todayBookings.map(b => b._id === updated._id ? updated : b);
        if (state.selectedBooking?._id === updated._id) {
          state.selectedBooking = updated;
        }
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Reject Booking
    builder
      .addCase(rejectBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.bookings = state.bookings.map(b => b._id === updated._id ? updated : b);
        state.todayBookings = state.todayBookings.filter(b => b._id !== updated._id);
      })
      .addCase(rejectBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark Seated
    builder
      .addCase(markSeated.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markSeated.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.bookings = state.bookings.map(b => b._id === updated._id ? updated : b);
        state.todayBookings = state.todayBookings.map(b => b._id === updated._id ? updated : b);
        if (state.selectedBooking?._id === updated._id) {
          state.selectedBooking = updated;
        }
      })
      .addCase(markSeated.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Complete Booking
    builder
      .addCase(completeBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.bookings = state.bookings.map(b => b._id === updated._id ? updated : b);
        state.todayBookings = state.todayBookings.filter(b => b._id !== updated._id);
        if (state.selectedBooking?._id === updated._id) {
          state.selectedBooking = updated;
        }
      })
      .addCase(completeBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark No Show
    builder
      .addCase(markNoShow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNoShow.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.bookings = state.bookings.map(b => b._id === updated._id ? updated : b);
        state.todayBookings = state.todayBookings.filter(b => b._id !== updated._id);
      })
      .addCase(markNoShow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Cancel Booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.bookings = state.bookings.map(b => b._id === updated._id ? updated : b);
        state.customerBookings = state.customerBookings.map(b => b._id === updated._id ? updated : b);
        if (state.selectedBooking?._id === updated._id) {
          state.selectedBooking = updated;
        }
        // persist customer bookings after cancel
        saveCustomerBookings(state.customerBookings);
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get Analytics
    builder
      .addCase(getBookingAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBookingAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(getBookingAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  updateBookingFromSocket,
  addBookingFromSocket,
  clearError,
  clearSuccess,
  setSelectedBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;
