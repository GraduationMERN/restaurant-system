import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { 
  createTable as createTableThunk,
  fetchTables as fetchTablesThunk,
  fetchFloorPlan as fetchFloorPlanThunk,
  checkAvailability as checkAvailabilityThunk,
  suggestTables as suggestTablesThunk,
  getTableStats as getTableStatsThunk,
  updateTable as updateTableThunk,
  deleteTable as deleteTableThunk,
} from '../redux/slices/tableSlice';
import {
  createBooking as createBookingThunk,
  fetchBookings as fetchBookingsThunk,
  fetchCustomerBookings as fetchCustomerBookingsThunk,
  fetchTodayBookings as fetchTodayBookingsThunk,
  fetchUpcomingBookings as fetchUpcomingBookingsThunk,
  fetchBookingById as fetchBookingByIdThunk,
  confirmBooking as confirmBookingThunk,
  rejectBooking as rejectBookingThunk,
  markSeated as markSeatedThunk,
  completeBooking as completeBookingThunk,
  markNoShow as markNoShowThunk,
  cancelBooking as cancelBookingThunk,
} from '../redux/slices/bookingSlice';

/**
 * Hook for booking API operations
 * Provides methods to create, fetch, and manage bookings
 */
export const useBookingAPI = () => {
  const dispatch = useDispatch();
  const loading = useSelector(state => state.booking?.loading);
  const error = useSelector(state => state.booking?.error);
  const success = useSelector(state => state.booking?.success);

  // Create new booking (dispatch Redux thunk so global state updates)
  const create = useCallback(async (data) => {
    const result = await dispatch(createBookingThunk(data));
    if (result.type === createBookingThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to create booking');
    }
  }, [dispatch]);

  // Fetch bookings list
  const fetchList = useCallback(async (restaurantId, date) => {
    const result = await dispatch(fetchBookingsThunk({ restaurantId, date }));
    if (result.type === fetchBookingsThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to fetch bookings');
    }
  }, [dispatch]);

  // Fetch today's bookings (cashier)
  const fetchToday = useCallback(async (restaurantId) => {
    const result = await dispatch(fetchTodayBookingsThunk(restaurantId));
    if (result.type === fetchTodayBookingsThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to fetch today bookings');
    }
  }, [dispatch]);

  // Fetch upcoming bookings (cashier)
  const fetchUpcoming = useCallback(async (restaurantId, days = 7) => {
    const result = await dispatch(fetchUpcomingBookingsThunk(restaurantId));
    if (result.type === fetchUpcomingBookingsThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to fetch upcoming bookings');
    }
  }, [dispatch]);

  // Fetch customer's own bookings
  const fetchCustomer = useCallback(async (restaurantId, customerEmail) => {
    if (!restaurantId || !customerEmail) {
      throw new Error('Restaurant ID and customer email are required');
    }
    console.log('🎣 [useBookingAPI.fetchCustomer] Calling thunk with:', { restaurantId, customerEmail });
    const result = await dispatch(fetchCustomerBookingsThunk({ restaurantId, customerEmail }));
    console.log('🎣 [useBookingAPI.fetchCustomer] Thunk returned action type:', result.type);
    console.log('🎣 [useBookingAPI.fetchCustomer] Payload:', result.payload);
    if (result.type === fetchCustomerBookingsThunk.fulfilled.type) {
      console.log('✅ [useBookingAPI.fetchCustomer] Success, returning:', result.payload);
      return result.payload;
    } else {
      console.error('❌ [useBookingAPI.fetchCustomer] Failed with payload:', result.payload);
      throw new Error(result.payload || 'Failed to fetch customer bookings');
    }
  }, [dispatch]);

  // Get single booking
  const getById = useCallback(async (bookingId) => {
    const result = await dispatch(fetchBookingByIdThunk(bookingId));
    if (result.type === fetchBookingByIdThunk.fulfilled.type) {
      return result.payload;
    }
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  }, [dispatch]);

  // Confirm booking and assign tables (cashier)
  const confirm = useCallback(async (bookingId, tableIds) => {
    const payloadTableIds = Array.isArray(tableIds) ? tableIds : (tableIds ? [tableIds] : []);
    const result = await dispatch(confirmBookingThunk({ bookingId, tableIds: payloadTableIds }));
    if (result.type === confirmBookingThunk.fulfilled.type) {
      // refresh tables for restaurant to reflect reserved status
      try {
        const updated = result.payload;
        if (updated?.restaurantId) {
          await dispatch(fetchTablesThunk(updated.restaurantId));
        }
      } catch (e) {
        // non-fatal
      }
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to confirm booking');
    }
  }, []);

  // Reject booking (cashier)
  const reject = useCallback(async (bookingId, reason = '') => {
    const result = await dispatch(rejectBookingThunk({ bookingId, reason }));
    if (result.type === rejectBookingThunk.fulfilled.type) {
      // refresh tables if restaurant available
      try {
        const updated = result.payload;
        if (updated?.restaurantId) {
          await dispatch(fetchTablesThunk(updated.restaurantId));
        }
      } catch (e) {}
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to reject booking');
    }
  }, []);

  // Mark guest as seated (cashier)
  const markSeated = useCallback(async (bookingId) => {
    const result = await dispatch(markSeatedThunk(bookingId));
    if (result.type === markSeatedThunk.fulfilled.type) {
      try {
        const updated = result.payload;
        if (updated?.restaurantId) await dispatch(fetchTablesThunk(updated.restaurantId));
      } catch (e) {}
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to mark seated');
    }
  }, []);

  // Mark booking as complete (cashier)
  const complete = useCallback(async (bookingId) => {
    const result = await dispatch(completeBookingThunk(bookingId));
    if (result.type === completeBookingThunk.fulfilled.type) {
      try {
        const updated = result.payload;
        if (updated?.restaurantId) await dispatch(fetchTablesThunk(updated.restaurantId));
      } catch (e) {}
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to complete booking');
    }
  }, []);

  // Mark as no-show (cashier)
  const markNoShow = useCallback(async (bookingId) => {
    const result = await dispatch(markNoShowThunk(bookingId));
    if (result.type === markNoShowThunk.fulfilled.type) {
      try {
        const updated = result.payload;
        if (updated?.restaurantId) await dispatch(fetchTablesThunk(updated.restaurantId));
      } catch (e) {}
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to mark no-show');
    }
  }, []);

  // Cancel booking (customer)
  // Accept either (bookingId, customerEmail) or a single object { bookingId, customerEmail }
  const cancel = useCallback(async (a, b) => {
    let bookingId = a;
    let customerEmail = b;
    if (a && typeof a === 'object') {
      bookingId = a.bookingId || a.id || a._id;
      customerEmail = a.customerEmail || a.email || a.customer;
    }

    if (!bookingId) throw new Error('bookingId is required to cancel');

    const result = await dispatch(cancelBookingThunk({ bookingId, customerEmail }));
    if (result.type === cancelBookingThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to cancel booking');
    }
  }, [dispatch]);

  // Get analytics (admin)
  const getAnalytics = useCallback(async (restaurantId, startDate, endDate) => {
    try {
      const response = await api.get(
        `/api/bookings/analytics?restaurantId=${restaurantId}&startDate=${startDate}&endDate=${endDate}`
      );
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  }, []);

  return {
    loading,
    error,
    success,
    create,
    fetchList,
    fetchToday,
    fetchUpcoming,
    fetchCustomer,
    getById,
    confirm,
    reject,
    markSeated,
    complete,
    markNoShow,
    cancel,
    getAnalytics,
  };
};

/**
 * Hook for table API operations
 * Provides methods to manage tables and check availability
 */
export const useTableAPI = () => {
  const dispatch = useDispatch();
  const loading = useSelector(state => state.table?.loading);
  const error = useSelector(state => state.table?.error);
  const success = useSelector(state => state.table?.success);

  // Create table (admin) - uses Redux thunk
  const create = useCallback(async (data) => {
    const result = await dispatch(createTableThunk(data));
    if (result.type === createTableThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to create table');
    }
  }, [dispatch]);

  // Fetch all tables - uses Redux thunk
  const fetchAll = useCallback(async (restaurantId) => {
    const result = await dispatch(fetchTablesThunk(restaurantId));
    if (result.type === fetchTablesThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to fetch tables');
    }
  }, [dispatch]);

  // Fetch floor plan - uses Redux thunk
  const fetchFloorPlan = useCallback(async (restaurantId) => {
    const result = await dispatch(fetchFloorPlanThunk(restaurantId));
    if (result.type === fetchFloorPlanThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to fetch floor plan');
    }
  }, [dispatch]);

  // Check availability for a specific time
  const checkAvailability = useCallback(async ({
    restaurantId,
    date,
    time,
    guests,
    durationMinutes = 120,
    bufferMinutes = 15,
  }) => {
    const result = await dispatch(checkAvailabilityThunk({
      restaurantId,
      date,
      time,
      guests,
      durationMinutes,
      bufferMinutes,
    }));
    if (result.type === checkAvailabilityThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to check availability');
    }
  }, [dispatch]);

  // Get smart table suggestions (cashier)
  const suggest = useCallback(async ({
    restaurantId,
    date,
    time,
    guests,
    durationMinutes = 120,
  }) => {
    const result = await dispatch(suggestTablesThunk({
      restaurantId,
      date,
      time,
      guests,
      durationMinutes,
    }));
    if (result.type === suggestTablesThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to get suggestions');
    }
  }, [dispatch]);

  // Get statistics for a date (admin)
  const getTableStats = useCallback(async (restaurantId, date) => {
    const result = await dispatch(getTableStatsThunk({ restaurantId, date }));
    if (result.type === getTableStatsThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to get stats');
    }
  }, [dispatch]);

  // Update table details (admin)
  const update = useCallback(async (tableId, data) => {
    const result = await dispatch(updateTableThunk({ tableId, data }));
    if (result.type === updateTableThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to update table');
    }
  }, [dispatch]);

  // Update table status (cashier/admin)
  const updateStatus = useCallback(async (tableId, status) => {
    try {
      const response = await api.patch(`/api/tables/${tableId}/status`, { status });
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  }, []);

  // Mark table as being cleaned (cashier)
  const markCleaning = useCallback(async (tableId) => {
    try {
      const response = await api.patch(`/api/tables/${tableId}/cleaning`);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  }, []);

  // Mark table as available after cleaning (cashier)
  const markAvailable = useCallback(async (tableId) => {
    try {
      const response = await api.patch(`/api/tables/${tableId}/available`);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  }, []);

  // Delete table (admin)
  const delete_ = useCallback(async (tableId) => {
    const result = await dispatch(deleteTableThunk(tableId));
    if (result.type === deleteTableThunk.fulfilled.type) {
      return result.payload;
    } else {
      throw new Error(result.payload || 'Failed to delete table');
    }
  }, [dispatch]);

  return {
    loading,
    error,
    success,
    create,
    fetchAll,
    fetchFloorPlan,
    checkAvailability,
    suggest,
    getTableStats,
    update,
    updateStatus,
    markCleaning,
    markAvailable,
    delete: delete_,
  };
};
