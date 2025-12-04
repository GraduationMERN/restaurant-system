import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../hooks/useToast";
import socketUtils from "../../utils/socket";
import { fetchActiveOrders, fetchOrderById } from "../../redux/slices/orderSlice";
import { updateOrderStatus as updateOrderStatusReducer } from "../../redux/slices/orderSlice";

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

    socket.on("notification", (payload) => {
      const message = payload?.message || payload?.title || "New notification";
      toast.showToast({ message, type: "success" });
    });

    socket.on("announcement", (payload) => {
      const message = payload?.message || payload?.title || "Announcement";
      toast.showToast({ message, type: "success" });
    });

    // Order update event: replace or fetch updated order
    socket.on("order:update", (payload) => {
      try {
        const orderId = payload?._id || payload?.orderId;
        if (orderId) {
          dispatch(fetchOrderById(orderId));
        }
        // Show a small toast for customers
        if (payload?.message) {
          toast.showToast({ message: payload.message, type: "info" });
        }
      } catch (e) {
        console.error("order:update handler error", e);
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

    return () => {
      socket.off("connect");
      socket.off("notification");
      socket.off("announcement");
      socket.off("order:update");
      socket.off("order:estimatedTime");
      // Do not disconnect singleton here to keep connection for other parts
    };
  }, [user, dispatch, toast]);

  return null;
}
