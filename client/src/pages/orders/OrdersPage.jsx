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
import { RefreshCw, Phone, Star } from "lucide-react";

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

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
     CALL RESTAURANT HANDLER
  ------------------------------------------- */
  const handleCallRestaurant = () => {
    // Replace with actual restaurant phone number
    const restaurantPhone = "+201234567890";
    window.location.href = `tel:${restaurantPhone}`;
  };

  /* ------------------------------------------
     SUBMIT REVIEW HANDLER
  ------------------------------------------- */
  const handleSubmitReview = async () => {
    if (!displayActiveOrder?._id) return;

    try {
      // TODO: Implement review submission to API
      // await api.post(`/api/reviews`, {
      //   orderId: displayActiveOrder._id,
      //   rating: reviewRating,
      //   comment: reviewText
      // });

      toast.showToast({
        message: "Thank you for your review!",
        type: "success",
      });

      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText("");
    } catch (err) {
      toast.showToast({
        message: "Failed to submit review",
        type: "error",
      });
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

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  bg-primary hover:bg-primary/80 dark:bg-primary dark:hover:bg-primary/90 text-white 
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
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                        <RefreshCw className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Order in Progress
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Track your order status below
                      </p>
                    </div>

                    {/* Last Updated */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-center">
                      <p className="text-blue-700 dark:text-blue-300 font-semibold">
                        Last updated
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                        {lastUpdated
                          ? new Date(lastUpdated).toLocaleTimeString()
                          : "Just now"}
                      </p>
                    </div>

                    {/* Active Order Component */}
                    <div className="mb-6">
                      <ActiveOrderComponent order={displayActiveOrder} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 flex-col md:flex-row">
                      <button 
                        onClick={handleCallRestaurant}
                        className="flex-1 px-4 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Call the restaurant
                      </button>
                      <button 
                        onClick={() => setShowReviewModal(true)}
                        className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Star className="w-5 h-5" />
                        Rate your experience
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Order History Card */}
              {displayHistory.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Order History
                  </h2>
                  <OrderHistoryComponent orders={displayHistory} />
                </div>
              )}

              {/* Empty */}
              {noOrders && <EmptyOrdersComponent />}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Rate Your Experience
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              How was your order?
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= reviewRating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Review Text */}
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your feedback (optional)..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
              rows="4"
            />

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSubmitReview}
                className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Submit Review
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(5);
                  setReviewText("");
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
