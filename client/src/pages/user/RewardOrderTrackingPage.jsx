import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaClock } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { showStatusNotification } from '../../utils/notifications';
import { Phone, Star } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useDispatch, useSelector } from 'react-redux';
import { createReview } from "../../redux/slices/reviewSlice";

export default function RewardOrderTrackingPage() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(state?.order || null);
  const [timeRemaining, setTimeRemaining] = useState(329); // 5:49 in seconds
  const [socket, setSocket] = useState(null);
  const orderId = order?._id || id;
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const toast = useToast();

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!orderId || !user?._id) return;

    const apiUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    const newSocket = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      // Register user
      newSocket.emit('register', user._id);
      console.log('✅ Registered user:', user._id);
    });

    // Single unified listener for order updates
    newSocket.on('order:updated', (updatedOrder) => {
      console.log('📦 Received order:updated', updatedOrder);
      if (updatedOrder?._id === orderId) {
        setOrder(updatedOrder);
        if (updatedOrder.status) {
          showStatusNotification(updatedOrder.status);
        }
      }
    });

    // Status change listener
    newSocket.on('order:status-changed', (updatedOrder) => {
      console.log('🔄 Received order:status-changed', updatedOrder);
      if (updatedOrder?._id === orderId) {
        setOrder(updatedOrder);
        showStatusNotification(updatedOrder.status);
      }
    });

    // Personal status change
    newSocket.on('order:your-status-changed', (updatedOrder) => {
      console.log('👤 Received order:your-status-changed', updatedOrder);
      if (updatedOrder?._id === orderId) {
        setOrder(updatedOrder);
        showStatusNotification(updatedOrder.status);
      }
    });

    // Ready notification
    newSocket.on('order:ready-notification', (updatedOrder) => {
      console.log('✅ Received order:ready-notification', updatedOrder);
      if (updatedOrder?._id === orderId) {
        setOrder(updatedOrder);
        showStatusNotification('Ready');
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [orderId, user?._id]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCallRestaurant = () => {
    const restaurantPhone = "+201234567890";
    window.location.href = `tel:${restaurantPhone}`;
  };

  const handleSubmitReview = async () => {
    try {
      const formData = new FormData();
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewText || "");
      
      await dispatch(createReview(formData)).unwrap();

      toast.showToast({ message: "Thank you for your review!", type: "success" });

      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText("");
    } catch (err) {
      toast.showToast({ message: err?.message || "Failed to submit review", type: "error" });
    }
  };

  // Get reward title
  const rewardTitle = order?.rewardId?.title || order?.rewardId?.productId?.name || 'Reward Item';
  const normalizedStatus = order?.status
    ? order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()
    : 'Preparing';

  // Determine status display - 3 step progression
  const statusSteps = [
    { label: 'Preparing', completed: ['Preparing', 'Confirmed', 'Ready'].includes(normalizedStatus) },
    { label: 'Confirmed', completed: ['Confirmed', 'Ready'].includes(normalizedStatus) },
    { label: 'Ready', completed: normalizedStatus === 'Ready' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {!order ? (
          // No order state - show basic info
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
            <FaCheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Reward Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">Your reward redemption has been processed.</p>

            <div className="bg-blue-50 dark:bg-primary rounded-xl p-4 mb-6">
              <p className="text-gray-700 dark:text-gray-200">Order ID: <span className="font-semibold">{id}</span></p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/orders')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                My Orders
              </button>
              <button
                onClick={() => navigate('/rewards')}
                className="px-6 py-2 bg-secondary text-white rounded-xl font-medium hover:bg-secondary/90 transition-colors"
              >
                Back to Rewards
              </button>
            </div>
          </div>
        ) : (
          // Full order details
          <div>
            {/* Order Confirmation Card */}
            <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-sm mb-6 overflow-x-hidden">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4">
                  <FaCheckCircle className="w-8 h-8 text-secondary" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">Order Confirmed!</h1>
                <p className="text-gray-600 dark:text-gray-400">Order confirmed! Kindly pick up your reward.</p>
              </div>

              {/* Branch Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-center overflow-x-hidden">
                <p className="text-secondary font-semibold">Branch Information</p>
                <p className="text-gray-400 text-sm mt-1">{order?.address || 'Main Branch'}</p>
              </div>

              {/* Progress Timeline */}
              <div className="mb-8">
                <div className="flex items-center justify-between gap-2 mb-8">
                  {statusSteps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                          step.completed ? 'bg-secondary text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <FaCheckCircle className="w-5 h-5" />
                        </div>
                        <p className={`text-sm font-medium transition-colors text-center ${
                          step.completed ? 'text-secondary' : 'text-gray-600'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div className={`flex-1 h-1 transition-colors mb-6 ${
                          step.completed ? 'bg-secondary' : 'bg-gray-300'
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
                  <span className="font-semibold text-2xl text-secondary">{formatTime(timeRemaining)}</span>
                  <span className="text-gray-600">Estimated ready time</span>
                </div>
                <p className="text-sm text-gray-600">We will let you know when your reward is ready.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-col md:flex-row">
                <button
                  onClick={handleCallRestaurant}
                  className="flex-1 px-4 py-3 border-2 border-secondary text-secondary rounded-xl font-semibold hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call the restaurant
                </button>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary/90 dark:bg-secondary dark:hover:bg-secondary/90 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5" />
                  Rate your experience
                </button>
              </div>
            </div>

            {showReviewModal && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-6 focus:outline-none focus:ring-2 focus:ring-secondary"
                    rows="4"
                  />

                  {/* Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleSubmitReview}
                      className="w-full bg-secondary hover:bg-secondary/90 dark:bg-secondary dark:hover:bg-secondary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
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

            {/* Order Details Card */}
            <div className="bg-white dark:border dark:bg-gray-900 dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Order #{order._id?.substring(order._id.length - 10).toUpperCase() || id?.substring(id.length - 10).toUpperCase()}
              </h2>

              {/* Items */}
              <div className="border-b border-gray-500 pb-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-700 font-semibold">{rewardTitle}</p>
                    {order?.rewardId?.productId?.basePrice && (
                      <p className="text-sm text-gray-600 mt-1">
                        Regular price: EGP {order.rewardId.productId.basePrice}
                      </p>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white font-semibold">Reward Item</p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="flex justify-between dark:text-gray-400 items-center text-gray-600">
                  <span>Points Used</span>
                  <span className="font-semibold dark:text-white text-gray-900">{order.pointsUsed}</span>
                </div>

                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Status</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                    order.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {normalizedStatus}
                  </span>
                </div>

                {order.redeemedAt && (
                  <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                    <span>Redeemed Date</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatDate(order.redeemedAt)}</span>
                  </div>
                )}

                {order.notes && (
                  <div className="flex justify-between items-start text-gray-600 pt-4 border-t border-gray-200">
                    <span>Notes</span>
                    <p className="text-gray-900 font-semibold text-right max-w-xs">{order.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-500 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total Points</span>
                  <span className="text-2xl font-bold text-secondary">{order.pointsUsed}</span>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex gap-3 mt-8 flex-col md:flex-row">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  My Orders
                </button>
                <button
                  onClick={() => navigate('/rewards')}
                  className="flex-1 px-4 py-3 bg-secondary text-white rounded-xl font-semibold hover:bg-secondary/90 transition-colors"
                >
                  Back to Rewards
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}