// OrdersPage.jsx - Main Orders Page
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchActiveOrder,
  fetchOrderHistory,
  setGuestActiveOrder,
  clearActiveOrder,
  updateActiveOrderFromSocket,
  handlePaymentUpdate,
  handleStatusUpdate,
} from "../../redux/slices/ordersSlice";
import socketClient from "../../utils/socketRedux";
import { useToast } from "../../hooks/useToast";
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

  // Determine if user is logged in
  const isLoggedIn = !!user && !user.isGuest;

  // Initialize socket listeners
  useEffect(() => {
    const socket = socketClient.getSocket() || socketClient.initSocket();
    if (!socket) return;

    // Listen for order status updates
    const handleOrderUpdate = (updatedOrder) => {
      dispatch(
        updateActiveOrderFromSocket(updatedOrder)
      );
      // Also show toast notification
      toast.showToast({
        message: `Order ${updatedOrder.orderNumber}: ${updatedOrder.status}`,
        type: "info",
        duration: 3000,
      });
    };

    // Listen for payment updates
    const handlePaymentUpdate = (data) => {
      dispatch(
        handlePaymentUpdate({
          orderId: data.orderId || data._id,
          paymentStatus: data.paymentStatus,
        })
      );
    };

    // Listen for status changes
    const handleStatusChange = (data) => {
      dispatch(
        handleStatusUpdate({
          orderId: data.orderId || data._id,
          status: data.status,
          estimatedReadyTime: data.estimatedReadyTime,
        })
      );
    };

    socket.on("order:updated", handleOrderUpdate);
    socket.on("order:your-payment-updated", handlePaymentUpdate);
    socket.on("order:your-status-changed", handleStatusChange);
    socket.on("order:status-changed", handleStatusChange);

    return () => {
      socket.off("order:updated", handleOrderUpdate);
      socket.off("order:your-payment-updated", handlePaymentUpdate);
      socket.off("order:your-status-changed", handleStatusChange);
      socket.off("order:status-changed", handleStatusChange);
    };
  }, [dispatch, toast]);

  // Fetch data on mount
  useEffect(() => {
    if (isLoggedIn) {
      // Fetch for logged-in users
      dispatch(fetchActiveOrder());
      dispatch(fetchOrderHistory());
    } else {
      // For guests, try to load from local storage
      const storedActiveOrder = localStorage.getItem("activeOrder");
      if (storedActiveOrder) {
        try {
          const parsedOrder = JSON.parse(storedActiveOrder);
          setGuestActiveOrderLocal(parsedOrder);
          dispatch(setGuestActiveOrder(parsedOrder));
        } catch (err) {
          console.error("Failed to parse stored order:", err);
        }
      }
    }
  }, [isLoggedIn, dispatch]);

  // Refresh handler
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
          duration: 2000,
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

  // Determine which order to display
  const displayActiveOrder = isLoggedIn ? activeOrder : guestActiveOrder;
  const displayOrderHistory = isLoggedIn ? orderHistory : [];

  // Loading state
  const isLoading = activeOrderLoading || historyLoading;

  // No orders state
  const hasNoOrders = !displayActiveOrder && displayOrderHistory.length === 0;

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

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Orders
            </h1>
            {isLoggedIn && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading your orders...
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* Active Order */}
              {displayActiveOrder && (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last updated:{" "}
                      {lastUpdated
                        ? new Date(lastUpdated).toLocaleTimeString()
                        : "Just now"}
                    </p>
                  </div>
                  <ActiveOrderComponent order={displayActiveOrder} />
                </>
              )}

              {/* Order History */}
              {displayOrderHistory.length > 0 && (
                <OrderHistoryComponent orders={displayOrderHistory} />
              )}

              {/* Empty State */}
              {hasNoOrders && <EmptyOrdersComponent />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
