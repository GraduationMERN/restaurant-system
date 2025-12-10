// OrdersPage.jsx - Main Orders Page
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchActiveOrder,
  fetchOrderHistory,
  setGuestActiveOrder,
} from "../../redux/slices/ordersSlice";
import socketClient, {
  setupSocketListeners,
  joinSocketRooms,
} from "../../utils/socketRedux";
import { useToast } from "../../hooks/useToast";
import api from "../../api/axios";
import ActiveOrderComponent from "./ActiveOrderComponent";
import OrderHistoryComponent from "./OrderHistoryComponent";
import EmptyOrdersComponent from "./EmptyOrdersComponent";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { RefreshCw } from "lucide-react";

export default function OrdersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    activeOrder,
    activeOrderLoading,
    orderHistory,
    historyLoading,
    lastUpdated,
  } = useSelector((state) => state.orders);

  const { user } = useSelector((state) => state.auth);
  const [guestActiveOrder, setGuestActiveOrderLocal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const isLoggedIn = !!user && !user.isGuest;

  /* ------------------------------------------
     ENSURE GUEST ID IS SET
  ------------------------------------------- */
  useEffect(() => {
    if (!isLoggedIn) {
      // For guests, ensure guestOrderId is generated early
      api.get("/api/orders/guest-id").catch(err => {
        console.error("Failed to get guest ID:", err);
      });
    }
  }, [isLoggedIn]);

  /* ------------------------------------------
     SOCKET INITIALIZATION
  ------------------------------------------- */
  useEffect(() => {
    const socket =
      socketClient.getSocket() || socketClient.initSocket();
    if (!socket) return;

    setupSocketListeners(socket);
    if (user) joinSocketRooms(socket, user);

    const notifyStatus = (data) => {
      const orderId = data.orderId || data._id;
      if (activeOrder && activeOrder._id === orderId) {
        toast.showToast({
          message: `Order status: ${data.status.toUpperCase()}`,
          type: "info",
          duration: 3000,
        });
      }
    };

    const notifyPayment = (data) => {
      const orderId = data.orderId || data._id;
      if (activeOrder && activeOrder._id === orderId) {
        const status = data.paymentStatus;
        const types = {
          paid: ["Payment confirmed!", "success"],
          failed: ["Payment failed", "error"],
          refunded: ["Order refunded", "success"],
        };

        if (types[status]) {
          toast.showToast({
            message: types[status][0],
            type: types[status][1],
            duration: 3000,
          });
        }
      }
    };

    socket.on("order:your-status-changed", notifyStatus);
    socket.on("order:status-changed", notifyStatus);
    socket.on("order:your-payment-updated", notifyPayment);

    return () => {
      socket.off("order:your-status-changed", notifyStatus);
      socket.off("order:status-changed", notifyStatus);
      socket.off("order:your-payment-updated", notifyPayment);
    };
  }, [activeOrder, user]);

  /* ------------------------------------------
     FETCH INITIAL DATA
  ------------------------------------------- */
  useEffect(() => {
    // Both logged in and guest users should fetch from API
    dispatch(fetchActiveOrder());
    dispatch(fetchOrderHistory());
  }, [dispatch]);

  /* ------------------------------------------
     REFRESH HANDLER
  ------------------------------------------- */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isLoggedIn) {
        await Promise.all([
          dispatch(fetchActiveOrder()),
          dispatch(fetchOrderHistory()),
        ]);

        toast.showToast({
          message: "Orders refreshed",
          type: "success",
          duration: 1500,
        });
      }
    } catch (err) {
      toast.showToast({
        message: "Failed to refresh orders",
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  /* ------------------------------------------
     DISPLAY DATA HANDLING
  ------------------------------------------- */
  const displayActiveOrder = activeOrder;
  const displayHistory = orderHistory;
  const isLoading = activeOrderLoading || historyLoading;
  const noOrders =
    !displayActiveOrder && displayHistory.length === 0;

  /* ------------------------------------------
     UI
  ------------------------------------------- */
  return (
    <>
      <PageMeta
        title="My Orders"
        description="Track your restaurant orders in real-time"
      />

      <PageBreadcrumb
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "My Orders", href: "/orders", active: true },
        ]}
      />

      <div className="min-h-screen bg-white dark:bg-gray-900 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Orders
            </h1>

            {isLoggedIn && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`
                  flex items-center gap-2 px-4 py-2
                  bg-primary hover:bg-primary/80 text-white 
                  font-semibold rounded-lg transition-colors
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              >
                <RefreshCw
                  className={`w-5 h-5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            )}
          </div>

          {/* LOADING */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading your orders...
                </p>
              </div>
            </div>
          )}

          {/* CONTENT */}
          {!isLoading && (
            <>
              {/* Active Order */}
              {displayActiveOrder && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Last updated:{" "}
                    {lastUpdated
                      ? new Date(lastUpdated).toLocaleTimeString()
                      : "Just now"}
                  </p>

                  <ActiveOrderComponent order={displayActiveOrder} />
                </>
              )}

              {/* History */}
              {displayHistory.length > 0 && (
                <OrderHistoryComponent orders={displayHistory} />
              )}

              {/* Empty */}
              {noOrders && <EmptyOrdersComponent />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
