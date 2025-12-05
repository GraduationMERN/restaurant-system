import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../hooks/useToast";
import socketUtils from "../../utils/socket";
import { fetchActiveOrders, fetchOrderById, fetchUserOrders } from "../../redux/slices/orderSlice";

export default function SocketInitializer() {
  const { user } = useSelector((state) => state.auth || {});
  const toast = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = socketUtils.initSocket();

    if (!socket) return;

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
      if (user && user._id) {
        socket.emit("register", user._id);
        if (user.role === "admin") socket.emit("joinAdmin");
        if (user.role) socket.emit("joinRole", user.role);
      }
    });

    // General notifications
    socket.on("notification", (payload) => {
      const message = payload?.message || payload?.title || "New notification";
      toast.showToast({ message, type: "success" });
    });

    socket.on("announcement", (payload) => {
      const message = payload?.message || payload?.title || "Announcement";
      toast.showToast({ message, type: "success" });
    });

    // === ORDER EVENTS ===

    // New order created (admin/cashier notification)
    socket.on("order:created", (payload) => {
      try {
        console.log("New order created:", payload);
        if (user?.role === "cashier" || user?.role === "admin") {
          toast.showToast({ 
            message: `New order received: ${payload?.orderNumber || 'Order'}`, 
            type: "success" 
          });
          // Refresh active orders
          if (user?.role === "cashier" || user?.role === "admin") {
            dispatch(fetchActiveOrders());
          }
        }
      } catch (e) {
        console.error("order:created handler error", e);
      }
    });

    // Order confirmed (customer notification)
    socket.on("order:confirmed", (payload) => {
      try {
        console.log("Order confirmed:", payload);
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
          // Show toast to customer
          if (payload?.message) {
            toast.showToast({ message: payload.message, type: "success" });
          } else {
            toast.showToast({ 
              message: "Your order has been confirmed!", 
              type: "success" 
            });
          }
        }
      } catch (e) {
        console.error("order:confirmed handler error", e);
      }
    });

    // Order status updated (kitchen/preparing/ready)
    socket.on("order:statusChanged", (payload) => {
      try {
        console.log("Order status changed:", payload);
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
          
          // Show context-aware notification
          if (payload?.status === "preparing") {
            toast.showToast({ 
              message: "Your order is being prepared!", 
              type: "info" 
            });
          } else if (payload?.status === "ready") {
            toast.showToast({ 
              message: "Your order is ready for pickup!", 
              type: "success" 
            });
          }
        }
      } catch (e) {
        console.error("order:statusChanged handler error", e);
      }
    });

    // Order completed
    socket.on("order:completed", (payload) => {
      try {
        console.log("Order completed:", payload);
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
          toast.showToast({ 
            message: "Order completed successfully!", 
            type: "success" 
          });
          // Refresh user orders
          if (user?._id) {
            dispatch(fetchUserOrders(user._id));
          }
        }
      } catch (e) {
        console.error("order:completed handler error", e);
      }
    });

    // Order cancelled
    socket.on("order:cancelled", (payload) => {
      try {
        console.log("Order cancelled:", payload);
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
          toast.showToast({ 
            message: "Order has been cancelled", 
            type: "info" 
          });
          // Refresh user orders
          if (user?._id) {
            dispatch(fetchUserOrders(user._id));
          }
        }
      } catch (e) {
        console.error("order:cancelled handler error", e);
      }
    });

    // Estimated time update
    socket.on("order:estimatedTime", (payload) => {
      try {
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
        }
        if (payload?.estimatedTime) {
          const msg = `Estimated time updated: ${payload.estimatedTime} minutes`;
          toast.showToast({ message: msg, type: "info" });
        }
      } catch (e) {
        console.error("order:estimatedTime handler error", e);
      }
    });

    // Refund processed
    socket.on("order:refunded", (payload) => {
      try {
        console.log("Order refunded:", payload);
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
          toast.showToast({ 
            message: `Refund processed: ${payload?.refundAmount || 'Amount'} EGP`, 
            type: "success" 
          });
        }
      } catch (e) {
        console.error("order:refunded handler error", e);
      }
    });

    // Old event name for backward compatibility
    socket.on("order:update", (payload) => {
      try {
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
        }
        if (payload?.message) {
          toast.showToast({ message: payload.message, type: "info" });
        }
      } catch (e) {
        console.error("order:update handler error", e);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("notification");
      socket.off("announcement");
      socket.off("order:created");
      socket.off("order:confirmed");
      socket.off("order:statusChanged");
      socket.off("order:completed");
      socket.off("order:cancelled");
      socket.off("order:estimatedTime");
      socket.off("order:refunded");
      socket.off("order:update");
    };
  }, [user, dispatch, toast]);

  return null;
}
