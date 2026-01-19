import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { 
  initializeSocket, 
  setupRoleListeners, 
  setupRestaurantListeners,
  disconnectSocket 
} from "../services/socketService";

/**
 * WebSocket Integration Hook
 * Initializes WebSocket connection and sets up Redux event listeners
 * Should be called once in App.jsx or main layout component
 */
export const useWebSocketIntegration = (userRole, restaurantId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize socket connection and pass dispatch so socket handlers can dispatch Redux actions
    initializeSocket(undefined, dispatch);

    // Setup listeners based on user role
    if (userRole === "cashier") {
      // join cashier room and restaurant room if available
      setupRoleListeners("cashier", dispatch, restaurantId);
    } else if (userRole === "admin" || userRole === "super-admin") {
      setupRestaurantListeners(restaurantId, dispatch);
    } else if (userRole === "customer") {
      setupRoleListeners("customer", dispatch, restaurantId);
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [userRole, restaurantId, dispatch]);
};

export default useWebSocketIntegration;
