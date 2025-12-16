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
import { createReview } from "../../redux/slices/reviewSlice";
import ActiveOrderComponent from "./ActiveOrderComponent";
import OrderHistoryComponent from "./OrderHistoryComponent";
import EmptyOrdersComponent from "./EmptyOrdersComponent";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { RefreshCw, Phone, Star, ShoppingBag } from "lucide-react";
import { FaCheckCircle, FaClock } from 'react-icons/fa';

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
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(329); // default countdown

  const isLoggedIn = !!user && !user.isGuest;

  /* ------------------------------------------
     ENSURE GUEST ID IS SET
  ------------------------------------------- */
  useEffect(() => {
    if (!isLoggedIn) {
      // For guests, ensure guestOrderId is generated early
      api.get("api/orders/guest-id").catch(err => {
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
      const formData = new FormData();
      formData.append("orderId", displayActiveOrder._id);
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewText || "");
      // optionally include product/reward reference if available
      if (displayActiveOrder?.rewardId?._id) {
        formData.append("rewardId", displayActiveOrder.rewardId._id);
      } else if (displayActiveOrder?.items && displayActiveOrder.items.length > 0) {
        const firstItem = displayActiveOrder.items[0];
        if (firstItem.productId) formData.append("productId", firstItem.productId);
      }

      // Dispatch createReview which expects FormData
      await dispatch(createReview(formData)).unwrap();

      toast.showToast({ message: "Thank you for your review!", type: "success" });

      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText("");
    } catch (err) {
      toast.showToast({ message: err?.message || "Failed to submit review", type: "error" });
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

  // Determine status display - 3 step progression
  const statusSteps = [
    { label: 'Confirmed', completed: displayActiveOrder?.status === 'Confirmed' || displayActiveOrder?.status === 'Preparing' || displayActiveOrder?.status === 'Ready' },
    { label: 'Preparing', completed: displayActiveOrder?.status === 'Preparing' || displayActiveOrder?.status === 'Ready' },
    { label: 'Ready', completed: displayActiveOrder?.status === 'Ready' }
  ];

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

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

      <div className="min-h-screen  bg-gray-50 dark:bg-gray-900 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Orders
            </h1>

            {isLoggedIn && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHistoryModal(true)}
                  disabled={refreshing}
                  className={`
                    flex items-center gap-2 px-4 py-2
                    bg-primary hover:bg-primary/80 dark:bg-secondary dark:hover:bg-secondary/90 text-white 
                    font-semibold rounded-lg transition-colors
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                >
                  <ShoppingBag className="w-5 h-5" />
                  View History
                </button>
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
              </div>
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

                    {/* Progress Timeline */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between gap-2 mb-8">
                        {statusSteps.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <div className="flex flex-col items-center flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                                step.completed ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                <FaCheckCircle className="w-5 h-5" />
                              </div>
                              <p className={`text-sm font-medium transition-colors text-center ${step.completed ? 'text-primary' : 'text-gray-600'}`}>
                                {step.label}
                              </p>
                            </div>
                            {idx < statusSteps.length - 1 && (
                              <div className={`flex-1 h-1 transition-colors mb-6 ${
                                step.completed ? 'bg-primary' : 'bg-gray-300'
                              }`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Estimated Time */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
                        <FaClock className="w-5 h-5" />
                        <span className="font-semibold text-2xl text-primary">{formatTime(timeRemaining)}</span>
                        <span className="text-gray-600">Estimated ready time</span>
                      </div>
                      <p className="text-sm text-gray-600">We will let you know when your order is ready.</p>
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

      {/* Order History Modal */}
      {showHistoryModal && (
        <>
          {/* Overlay with blur */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowHistoryModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header with Close Button */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-3xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Order History
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {displayHistory.length > 0 ? (
                  <OrderHistoryComponent orders={displayHistory} />
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No order history yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
