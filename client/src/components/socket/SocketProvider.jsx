import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import socketClient from "../../utils/socketRedux";
import { useRole } from "../../hooks/useRole";
import { fetchActiveOrders, fetchUserOrders, fetchOrderById } from "../../redux/slices/orderSlice";
import { useToast } from "../../hooks/useToast";

export default function SocketProvider() {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth?.user);
  const { isAdmin, isCashier, isKitchen, user } = useRole();
  const toast = useToast();

  useEffect(() => {
    const s = socketClient.initSocket();
    console.log('SocketProvider: socket instance', s?.id, s?.connected);
    if (!s) return;

    // When authUser changes, request server to join rooms for this user/role
    if (authUser) {
      console.log('SocketProvider: joining rooms for user', authUser?.id || authUser?._id);
      socketClient.joinSocketRooms(s, authUser);
    }

    // UI-level listeners: notifications and personalized updates
    const onNotification = (payload) => {
      const message = payload?.message || payload?.title || "New notification";
      toast.showToast({ message, type: "success" });
    };

    const onAnnouncement = (payload) => {
      const message = payload?.message || payload?.title || "Announcement";
      toast.showToast({ message, type: "info" });
    };

    const onYourStatusChanged = (payload) => {
      const orderId = payload?._id || payload?.orderId;
      if (orderId) {
        dispatch(fetchOrderById(orderId));
      }
      if (payload?.message) toast.showToast({ message: payload.message, type: "info" });
    };

    const onYourPaymentUpdated = (payload) => {
      const orderId = payload?._id || payload?.orderId;
      if (orderId) dispatch(fetchOrderById(orderId));
      if (payload?.paymentStatus === "paid") toast.showToast({ message: "Payment confirmed", type: "success" });
    };

    s.on("notification", onNotification);
    s.on("announcement", onAnnouncement);
    s.on("order:your-status-changed", onYourStatusChanged);
    s.on("order:your-payment-updated", onYourPaymentUpdated);

    return () => {
      s.off("notification", onNotification);
      s.off("announcement", onAnnouncement);
      s.off("order:your-status-changed", onYourStatusChanged);
      s.off("order:your-payment-updated", onYourPaymentUpdated);
    };
  }, [authUser, dispatch]);

  return null;
}
