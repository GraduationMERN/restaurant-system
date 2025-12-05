import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import socketClient from "../../utils/socket";
import { useSelector } from "react-redux";
import { useRole } from "../../hooks/useRole";
import { upsertOrder, fetchActiveOrders, fetchUserOrders } from "../../redux/slices/orderSlice";

export default function SocketProvider() {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth?.user);
  const { isAdmin, isCashier, isKitchen, user } = useRole();

  useEffect(() => {
    const s = socketClient.initSocket();
    if (!s) return;

    // When user changes, register socket and join appropriate rooms
    if (authUser && authUser._id) {
      // server expects a string userId on 'register'
      s.emit("register", authUser._id);
      if (isAdmin) s.emit("joinRole", "admin");
      if (isCashier) s.emit("joinRole", "cashier");
      if (isKitchen) s.emit("joinRole", "kitchen");
    }

    const onCreated = (order) => {
      try { console.log('[SocketProvider] order:created', order); } catch(e){}
      dispatch(upsertOrder(order));
      dispatch(fetchActiveOrders());
      if (authUser && order.customerId === authUser._id) dispatch(fetchUserOrders(authUser._id));
    };

    const onUpdated = (order) => {
      try { console.log('[SocketProvider] order:updated', order); } catch(e){}
      dispatch(upsertOrder(order));
      dispatch(fetchActiveOrders());
      if (authUser && order.customerId === authUser._id) dispatch(fetchUserOrders(authUser._id));
    };

    s.on("order:created", onCreated);
    s.on("order:updated", onUpdated);
    s.on("order:confirmed", onUpdated);
    s.on("order:ready", onUpdated);
    s.on("order:completed", onUpdated);
    s.on("order:refunded", onUpdated);

    return () => {
      s.off("order:created", onCreated);
      s.off("order:updated", onUpdated);
      s.off("order:confirmed", onUpdated);
      s.off("order:ready", onUpdated);
      s.off("order:completed", onUpdated);
      s.off("order:refunded", onUpdated);
    };
  }, [authUser, isAdmin, isCashier, isKitchen, dispatch]);

  return null;
}
