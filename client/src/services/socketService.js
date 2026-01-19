// WebSocket service for real-time table booking updates
// Connects to backend WebSocket events and dispatches Redux actions

import io from 'socket.io-client';

let socket = null;

/**
 * Initialize WebSocket connection
 * @param {string} url - WebSocket server URL (defaults to backend URL)
 * @param {function} dispatch - Redux dispatch function
 * @returns {object} Socket instance
 */
export const initializeSocket = (url = 'http://localhost:8000', dispatch) => {
  if (socket) return socket;

  socket = io(url, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  // Connection events
  socket.on('connect', () => {
    console.log('✅ WebSocket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  // Booking events
  socket.on('booking:new', (booking) => {
    console.log('📌 New booking:', booking);
    // Dispatch action to add new booking to Redux
    if (dispatch) {
      dispatch({
        type: 'booking/addBookingFromSocket',
        payload: booking,
      });
    }
  });

  socket.on('booking:confirmed', (booking) => {
    console.log('✅ Booking confirmed:', booking);
    if (dispatch) {
      dispatch({
        type: 'booking/updateBookingFromSocket',
        payload: booking,
      });
    }
  });

  socket.on('booking:seated', (booking) => {
    console.log('🪑 Guest seated:', booking);
    if (dispatch) {
      dispatch({
        type: 'booking/updateBookingFromSocket',
        payload: booking,
      });
    }
  });

  socket.on('booking:completed', (booking) => {
    console.log('✓ Booking completed:', booking);
    if (dispatch) {
      dispatch({
        type: 'booking/updateBookingFromSocket',
        payload: booking,
      });
    }
  });

  socket.on('booking:cancelled', (booking) => {
    console.log('❌ Booking cancelled:', booking);
    if (dispatch) {
      dispatch({
        type: 'booking/updateBookingFromSocket',
        payload: booking,
      });
    }
  });

  socket.on('booking:updated', (booking) => {
    console.log('📝 Booking updated:', booking);
    if (dispatch) {
      dispatch({
        type: 'booking/updateBookingFromSocket',
        payload: booking,
      });
    }
  });

  // Table events
  socket.on('table:updated', (table) => {
    console.log('🔄 Table updated:', table);
    if (dispatch) {
      dispatch({
        type: 'table/updateTableFromSocket',
        payload: table,
      });
    }
  });

  return socket;
};

/**
 * Get existing socket instance or create new one
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect WebSocket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit event to server
 */
export const emitSocketEvent = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  } else {
    console.warn('Socket not initialized');
  }
};

/**
 * Join a room (e.g., restaurant:rest_123, cashier)
 */
export const joinRoom = (room) => {
  if (socket) {
    socket.emit('join-room', room);
    console.log(`✅ Joined room: ${room}`);
  }
};

/**
 * Leave a room
 */
export const leaveRoom = (room) => {
  if (socket) {
    socket.emit('leave-room', room);
    console.log(`❌ Left room: ${room}`);
  }
};

/**
 * Helper to listen for specific role-based events
 */
export const setupRoleListeners = (role, dispatch, restaurantId) => {
  if (!socket) return;

  // Join common rooms based on role
  if (role === 'cashier' || role === 'admin') {
    // Cashiers listen to a shared 'cashier' room for new bookings
    joinRoom('cashier');
  }

  // If restaurantId provided, also join the restaurant-specific room
  if (restaurantId) {
    joinRoom(`restaurant:${restaurantId}`);
  }
};

/**
 * Setup restaurant-specific listeners
 */
export const setupRestaurantListeners = (restaurantId, dispatch) => {
  if (!socket || !restaurantId) return;

  const room = `restaurant:${restaurantId}`;
  joinRoom(room);
};

/**
 * Get socket connection status
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Default export: Socket service wrapper
 */
const socketService = {
  initialize: initializeSocket,
  get: getSocket,
  disconnect: disconnectSocket,
  emit: emitSocketEvent,
  join: joinRoom,
  leave: leaveRoom,
  setupRoleListeners,
  setupRestaurantListeners,
  isConnected: isSocketConnected,
  // Direct socket access for advanced usage
  getSocket: getSocket,
  on: (event, callback) => socket?.on(event, callback),
  off: (event, callback) => socket?.off(event, callback),
};

export default socketService;
