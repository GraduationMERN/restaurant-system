import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async thunks for table API calls

export const createTable = createAsyncThunk(
  "table/createTable",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/tables", data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTables = createAsyncThunk(
  "table/fetchTables",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/tables?restaurantId=${restaurantId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchFloorPlan = createAsyncThunk(
  "table/fetchFloorPlan",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/tables/floor-plan?restaurantId=${restaurantId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const checkAvailability = createAsyncThunk(
  "table/checkAvailability",
  async ({ restaurantId, date, time, guests, durationMinutes, bufferMinutes }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        restaurantId,
        date,
        time,
        guests,
      });
      if (durationMinutes) params.append("durationMinutes", durationMinutes);
      if (bufferMinutes) params.append("bufferMinutes", bufferMinutes);
      
      const response = await api.get(`/api/tables/availability?${params}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const suggestTables = createAsyncThunk(
  "table/suggestTables",
  async ({ restaurantId, date, time, guests, durationMinutes }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        restaurantId,
        date,
        time,
        guests,
      });
      if (durationMinutes) params.append("durationMinutes", durationMinutes);
      
      const response = await api.get(`/api/tables/suggest?${params}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getTableStats = createAsyncThunk(
  "table/getStats",
  async ({ restaurantId, date }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/tables/stats?restaurantId=${restaurantId}&date=${date}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateTable = createAsyncThunk(
  "table/updateTable",
  async ({ tableId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/tables/${tableId}`, data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateTableStatus = createAsyncThunk(
  "table/updateTableStatus",
  async ({ tableId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/tables/${tableId}/status`, { status });
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markTableCleaning = createAsyncThunk(
  "table/markCleaning",
  async (tableId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/tables/${tableId}/cleaning`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markTableAvailable = createAsyncThunk(
  "table/markAvailable",
  async (tableId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/tables/${tableId}/available`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteTable = createAsyncThunk(
  "table/deleteTable",
  async (tableId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/tables/${tableId}`);
      return tableId; // Return ID for removal from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  // Lists
  tables: [],
  floorPlan: [],
  
  // Search results
  availableTables: [],
  tableSuggestions: null,
  
  // Detail
  selectedTable: null,
  
  // Analytics
  stats: null,
  
  // UI
  loading: false,
  error: null,
  success: false,
};

const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    // Update table from WebSocket event
    updateTableFromSocket: (state, action) => {
      const updatedTable = action.payload;
      
      // Update in all lists
      state.tables = state.tables.map(t =>
        t._id === updatedTable._id ? updatedTable : t
      );
      state.floorPlan = state.floorPlan.map(t =>
        t._id === updatedTable._id ? updatedTable : t
      );
      state.availableTables = state.availableTables.map(t =>
        t._id === updatedTable._id ? updatedTable : t
      );
      
      // Update selected if it's the same
      if (state.selectedTable?._id === updatedTable._id) {
        state.selectedTable = updatedTable;
      }
    },
    
    // Clear search results
    clearAvailability: (state) => {
      state.availableTables = [];
      state.tableSuggestions = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    clearSuccess: (state) => {
      state.success = false;
    },
    
    setSelectedTable: (state, action) => {
      state.selectedTable = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    // Create Table
    builder
      .addCase(createTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.tables.unshift(action.payload);
      })
      .addCase(createTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Tables
    builder
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Floor Plan
    builder
      .addCase(fetchFloorPlan.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFloorPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.floorPlan = action.payload;
      })
      .addCase(fetchFloorPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Check Availability
    builder
      .addCase(checkAvailability.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availableTables = action.payload;
      })
      .addCase(checkAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.availableTables = [];
      });

    // Suggest Tables
    builder
      .addCase(suggestTables.pending, (state) => {
        state.loading = true;
      })
      .addCase(suggestTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tableSuggestions = action.payload;
      })
      .addCase(suggestTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.tableSuggestions = null;
      });

    // Get Stats
    builder
      .addCase(getTableStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTableStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getTableStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Table
    builder
      .addCase(updateTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTable.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.tables = state.tables.map(t => t._id === updated._id ? updated : t);
        if (state.selectedTable?._id === updated._id) {
          state.selectedTable = updated;
        }
      })
      .addCase(updateTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Table Status
    builder
      .addCase(updateTableStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.tables = state.tables.map(t => t._id === updated._id ? updated : t);
        state.floorPlan = state.floorPlan.map(t => t._id === updated._id ? updated : t);
        if (state.selectedTable?._id === updated._id) {
          state.selectedTable = updated;
        }
      })
      .addCase(updateTableStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark Cleaning
    builder
      .addCase(markTableCleaning.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markTableCleaning.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.tables = state.tables.map(t => t._id === updated._id ? updated : t);
      })
      .addCase(markTableCleaning.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark Available
    builder
      .addCase(markTableAvailable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markTableAvailable.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload;
        state.tables = state.tables.map(t => t._id === updated._id ? updated : t);
      })
      .addCase(markTableAvailable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Table
    builder
      .addCase(deleteTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.tables = state.tables.filter(t => t._id !== action.payload);
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  updateTableFromSocket,
  clearAvailability,
  clearError,
  clearSuccess,
  setSelectedTable,
} = tableSlice.actions;

export default tableSlice.reducer;
