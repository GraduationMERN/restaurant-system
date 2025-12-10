import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaClock } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { showStatusNotification } from '../../utils/notifications';

export default function RewardOrderTrackingPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(state?.order || null);
  const [timeRemaining, setTimeRemaining] = useState(329); // 5:49 in seconds
  const [socket, setSocket] = useState(null);
  const orderId = order?._id || id;

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!orderId) return; // Don't connect if we don't have an order ID

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    const newSocket = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      // Join the reward order room
      newSocket.emit('join_reward_order', { orderId });
    });
    // Listen for reward order updates
    newSocket.on('reward_order_updated', (updatedOrder) => {
      setOrder(updatedOrder);
    });

    // Listen for reward order status changes
    newSocket.on('reward_order_status_changed', (data) => {
      if (data.order) {
        setOrder(data.order);
        // Show notification on status change
        showStatusNotification(data.order.status);
      } else if (data.status) {
        setOrder(prev => ({ ...prev, status: data.status }));
        // Show notification on status change
        showStatusNotification(data.status);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [orderId]);

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

  // status notifications are handled by shared util (showStatusNotification)

  // Get reward title
  const rewardTitle = order?.rewardId?.title || order?.rewardId?.productId?.name || 'Reward Item';

  // Determine status display - 3 step progression
  const statusSteps = [
    { label: 'Preparing', completed: order?.status === 'Preparing' || order?.status === 'Confirmed' || order?.status === 'Ready' },
    { label: 'Confirmed', completed: order?.status === 'Confirmed' || order?.status === 'Ready' },
    { label: 'Ready', completed: order?.status === 'Ready' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        {!order ? (
          // No order state - show basic info
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center ">
            <FaCheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Reward Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">Your reward redemption has been processed.</p>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-gray-700">Order ID: <span className="font-semibold">{id}</span></p>
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
          <>
            {/* Order Confirmation Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-6 overflow-x-hidden">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <FaCheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                <p className="text-gray-600">Order confirmed! Kindly pick up your reward.</p>
              </div>

              {/* Branch Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center overflow-x-hidden">
                <p className="text-blue-700 font-semibold">Branch Information</p>
                <p className="text-gray-700 text-sm mt-1">{order?.address || 'Main Branch'}</p>
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
                <p className="text-sm text-gray-600">We will let you know when your reward is ready.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-col md:flex-row">
                <button className="flex-1 px-4 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                  <span>📞</span>
                  Call the restaurant
                </button>
                <button className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <span>⭐</span>
                  Rate your experience
                </button>
              </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order #{order._id?.substring(order._id.length - 10).toUpperCase() || id?.substring(id.length - 10).toUpperCase()}
              </h2>

              {/* Items */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-700 font-semibold">{rewardTitle}</p>
                    {order?.rewardId?.productId?.basePrice && (
                      <p className="text-sm text-gray-600 mt-1">
                        Regular price: EGP {order.rewardId.productId.basePrice}
                      </p>
                    )}
                  </div>
                  <p className="text-gray-900 font-semibold">Reward Item</p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Points Used</span>
                  <span className="font-semibold text-gray-900">{order.pointsUsed}</span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>Status</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                    order.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status || 'Preparing'}
                  </span>
                </div>

                {order.redeemedAt && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Redeemed Date</span>
                    <span className="font-semibold text-gray-900">{formatDate(order.redeemedAt)}</span>
                  </div>
                )}

                {order.notes && (
                  <div className="flex justify-between items-start text-gray-600 pt-4 border-t border-gray-200">
                    <span>Notes</span>
                    <p className="text-gray-900 font-semibold text-right max-w-xs">{order.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Points</span>
                  <span className="text-2xl font-bold text-primary">{order.pointsUsed}</span>
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
          </>
        )}
      </div>
    </div>
  );
}

