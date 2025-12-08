// kitchenSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

const unwrap = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

// Fetch active orders
export const fetchKitchenActive = createAsyncThunk(
  "kitchen/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/orders/kitchen/active");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Change order status
export const changeOrderStatus = createAsyncThunk(
  "kitchen/changeStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { status });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔥 NEW: Update item status (if you have per-item preparation)
export const updateItemStatus = createAsyncThunk(
  "kitchen/updateItemStatus",
  async ({ orderId, itemId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/items/${itemId}`, { status });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔥 NEW: Update estimated time
export const updateKitchenEstimatedTime = createAsyncThunk(
  "kitchen/updateEstimatedTime",
  async ({ orderId, estimatedTime }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { estimatedTime });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const kitchenSlice = createSlice({
  name: "kitchen",
  initialState: {
    activeOrders: [],
    preparingOrders: [],
    readyOrders: [],
    confirmedOrders: [],
    loading: false,
    error: null,
    successMessage: null,
    socketConnected: false,
    newOrderAlert: null,
    stats: {
      totalActive: 0,
      preparing: 0,
      ready: 0,
      avgPreparationTime: 0,
    }
  },
  reducers: {
    clearKitchenMessages(state) {
      state.error = null;
      state.successMessage = null;
      state.newOrderAlert = null;
    },
    
    // Socket event handlers
    socketNewOrder: (state, action) => {
      const newOrder = action.payload;
      if (!newOrder?._id) return;
      
      // Add to active orders if not already there
      if (!state.activeOrders.find(o => o._id === newOrder._id)) {
        state.activeOrders.unshift(newOrder);
      }
      
      // Add to appropriate category
      if (newOrder.status === "confirmed") {
        if (!state.confirmedOrders.find(o => o._id === newOrder._id)) {
          state.confirmedOrders.unshift(newOrder);
        }
      } else if (newOrder.status === "preparing") {
        if (!state.preparingOrders.find(o => o._id === newOrder._id)) {
          state.preparingOrders.unshift(newOrder);
        }
      } else if (newOrder.status === "ready") {
        if (!state.readyOrders.find(o => o._id === newOrder._id)) {
          state.readyOrders.unshift(newOrder);
        }
      }
      
      // Set alert for new confirmed orders
      if (newOrder.status === "confirmed") {
        state.newOrderAlert = {
          orderId: newOrder._id,
          orderNumber: newOrder.orderNumber,
          itemsCount: newOrder.items?.length || 0,
          serviceType: newOrder.serviceType,
          timestamp: new Date()
        };
      }
      
      // Update stats
      state.stats.totalActive = state.activeOrders.length;
      state.stats.preparing = state.preparingOrders.length;
      state.stats.ready = state.readyOrders.length;
    },
    
    socketOrderUpdated: (state, action) => {
      const updatedOrder = action.payload;
      if (!updatedOrder?._id) return;
      // Capture previous status before mutating arrays
      const prevOrder = state.activeOrders.find(o => o._id === updatedOrder._id);
      const oldStatus = prevOrder?.status;

      // Update in active orders
      state.activeOrders = state.activeOrders.map(o => 
        o._id === updatedOrder._id ? updatedOrder : o
      );

      // If status changed, remove from old category and add to new category
      if (oldStatus !== updatedOrder.status) {
        // Remove from old category
        if (oldStatus === "confirmed") {
          state.confirmedOrders = state.confirmedOrders.filter(o => o._id !== updatedOrder._id);
        } else if (oldStatus === "preparing") {
          state.preparingOrders = state.preparingOrders.filter(o => o._id !== updatedOrder._id);
        } else if (oldStatus === "ready") {
          state.readyOrders = state.readyOrders.filter(o => o._id !== updatedOrder._id);
        }

        // Add to new category
        if (updatedOrder.status === "confirmed") {
          if (!state.confirmedOrders.find(o => o._id === updatedOrder._id)) {
            state.confirmedOrders.unshift(updatedOrder);
          }
        } else if (updatedOrder.status === "preparing") {
          if (!state.preparingOrders.find(o => o._id === updatedOrder._id)) {
            state.preparingOrders.unshift(updatedOrder);
          }
        } else if (updatedOrder.status === "ready") {
          if (!state.readyOrders.find(o => o._id === updatedOrder._id)) {
            state.readyOrders.unshift(updatedOrder);
          }
        }
      }

      // Remove if completed/cancelled
      if (["completed", "cancelled"].includes(updatedOrder.status)) {
        state.activeOrders = state.activeOrders.filter(o => o._id !== updatedOrder._id);
        state.confirmedOrders = state.confirmedOrders.filter(o => o._id !== updatedOrder._id);
        state.preparingOrders = state.preparingOrders.filter(o => o._id !== updatedOrder._id);
        state.readyOrders = state.readyOrders.filter(o => o._id !== updatedOrder._id);
      }

      // Update stats
      state.stats.totalActive = state.activeOrders.length;
      state.stats.preparing = state.preparingOrders.length;
      state.stats.ready = state.readyOrders.length;
    },
    
    socketOrderDeleted: (state, action) => {
      const { orderId } = action.payload;
      
      // Remove from all arrays
      state.activeOrders = state.activeOrders.filter(o => o._id !== orderId);
      state.confirmedOrders = state.confirmedOrders.filter(o => o._id !== orderId);
      state.preparingOrders = state.preparingOrders.filter(o => o._id !== orderId);
      state.readyOrders = state.readyOrders.filter(o => o._id !== orderId);
      
      // Update stats
      state.stats.totalActive = state.activeOrders.length;
      state.stats.preparing = state.preparingOrders.length;
      state.stats.ready = state.readyOrders.length;
    },
    
    // Kitchen-specific socket events
    socketKitchenUpdate: (state, action) => {
      const order = action.payload;
      if (!order?._id) return;
      
      // Update order in all arrays
      state.activeOrders = state.activeOrders.map(o => 
        o._id === order._id ? order : o
      );
      
      if (order.status === "preparing") {
        state.preparingOrders = state.preparingOrders.map(o => 
          o._id === order._id ? order : o
        );
      }
      
      // Update preparation progress if available
      if (order.preparationProgress !== undefined) {
        state.activeOrders = state.activeOrders.map(o => 
          o._id === order._id ? { ...o, preparationProgress: order.preparationProgress } : o
        );
      }
    },
    
    // Filter and sort (multi-criteria stable sort)
    sortOrdersBy: (state, action) => {
      const { field, ascending = true } = action.payload;

      // Priority-based comparator: status priority -> estimatedTime -> createdAt
      const statusPriority = (s) => {
        const map = {
          confirmed: 0,
          preparing: 1,
          ready: 2,
          pending: 3
        };
        return map[s] ?? 99;
      };

      const compare = (a, b) => {
        // status priority
        const sp = statusPriority(a.status) - statusPriority(b.status);
        if (sp !== 0) return ascending ? sp : -sp;

        // estimatedTime (smaller first)
        const aEst = a.estimatedTime ?? Infinity;
        const bEst = b.estimatedTime ?? Infinity;
        if (aEst !== bEst) return ascending ? aEst - bEst : bEst - aEst;

        // createdAt (older first)
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        if (aDate !== bDate) return ascending ? aDate - bDate : bDate - aDate;

        return 0;
      };

      state.activeOrders.sort(compare);
      state.confirmedOrders.sort(compare);
      state.preparingOrders.sort(compare);
      state.readyOrders.sort(compare);
    },
    
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    
    clearNewOrderAlert: (state) => {
      state.newOrderAlert = null;
    },
    
    // Update item preparation status locally
    updateItemPreparation: (state, action) => {
      const { orderId, itemId, prepared } = action.payload;
      
      state.activeOrders = state.activeOrders.map(order => {
        if (order._id === orderId) {
          const updatedItems = order.items.map(item => 
            item._id === itemId || item.productId === itemId 
              ? { ...item, prepared } 
              : item
          );
          
          const preparedCount = updatedItems.filter(item => item.prepared).length;
          const totalItems = updatedItems.length;
          const preparationProgress = totalItems > 0 ? (preparedCount / totalItems) * 100 : 0;
          
          return { 
            ...order, 
            items: updatedItems,
            preparationProgress 
          };
        }
        return order;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // FETCH ACTIVE ORDERS
      .addCase(fetchKitchenActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKitchenActive.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const orders = Array.isArray(action.payload.data) ? action.payload.data : [];
          state.activeOrders = orders;
          
          // Categorize orders
          state.confirmedOrders = orders.filter(o => o.status === "confirmed");
          state.preparingOrders = orders.filter(o => o.status === "preparing");
          state.readyOrders = orders.filter(o => o.status === "ready");
          
          // Update stats
          state.stats.totalActive = orders.length;
          state.stats.preparing = state.preparingOrders.length;
          state.stats.ready = state.readyOrders.length;
          
          // Calculate average preparation time
          const totalTime = orders.reduce((sum, order) => sum + (order.estimatedTime || 0), 0);
          state.stats.avgPreparationTime = orders.length > 0 
            ? Math.round(totalTime / orders.length) 
            : 0;
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(fetchKitchenActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch active orders";
      })

      // CHANGE ORDER STATUS
      .addCase(changeOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.successMessage = "Order status updated";
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(changeOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update order status";
      })

      // UPDATE ESTIMATED TIME
      .addCase(updateKitchenEstimatedTime.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.successMessage = "Estimated time updated";
        }
      });
  }
});

export const {
  clearKitchenMessages,
  socketNewOrder,
  socketOrderUpdated,
  socketOrderDeleted,
  socketKitchenUpdate,
  sortOrdersBy,
  setSocketConnected,
  clearNewOrderAlert,
  updateItemPreparation
} = kitchenSlice.actions;

export default kitchenSlice.reducer;