// ActiveOrderComponent.jsx - Live Tracking for Active Order
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { cancelOrder } from "../../redux/slices/ordersSlice";
import { useToast } from "../../hooks/useToast";
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  XCircle,
  ChefHat,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function ActiveOrderComponent({ order }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const [canceling, setCanceling] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Status progression
  const statusProgression = ["pending", "confirmed", "preparing", "ready", "completed"];
  const currentStatusIndex = statusProgression.indexOf(order?.status) || 0;
  const progressPercent = ((currentStatusIndex + 1) / statusProgression.length) * 100;

  // ETA countdown timer
  useEffect(() => {
    if (!order?.estimatedReadyTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const estimatedTime = new Date(order.estimatedReadyTime).getTime();
      const distance = estimatedTime - now;

      if (distance <= 0) {
        setCountdownSeconds(0);
        clearInterval(interval);
      } else {
        setCountdownSeconds(Math.ceil(distance / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.estimatedReadyTime]);

  // Format countdown
  const formatCountdown = (seconds) => {
    if (seconds <= 0) return "Ready Now!";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!order?._id) return;

    try {
      setCanceling(true);
      await dispatch(cancelOrder(order._id)).unwrap();
      toast.showToast({
        message: "Order cancelled successfully",
        type: "success",
      });
      setShowCancelConfirm(false);
    } catch (err) {
      toast.showToast({
        message: err || "Failed to cancel order",
        type: "error",
      });
    } finally {
      setCanceling(false);
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "confirmed":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "preparing":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700";
      case "ready":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
      case "completed":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
    }
  };

  // Status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "preparing":
        return <ChefHat className="w-5 h-5" />;
      case "ready":
        return <Zap className="w-5 h-5" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (!order) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
      {/* Header with Order Number and Status */}
      <div className="bg-linear-to-r from-orange-500 to-orange-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Order Number</p>
            <h2 className="text-3xl font-bold">{order.orderNumber}</h2>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm ${
            order.status === "ready" ? "animate-pulse" : ""
          }`}>
            {getStatusIcon(order.status)}
            <span className="font-semibold capitalize">{order.status}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Countdown Timer */}
        {order.estimatedReadyTime && (
          <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-1">
              Estimated Ready Time
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCountdown(countdownSeconds)}
            </p>
          </div>
        )}

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Customer
            </h3>
            <div className="space-y-2">
              <p className="text-gray-900 dark:text-white font-medium">
                {order.customerInfo?.name || "Guest"}
              </p>
              {order.customerInfo?.phone && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {order.customerInfo.phone}
                </p>
              )}
              {order.customerInfo?.email && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {order.customerInfo.email}
                </p>
              )}
            </div>
          </div>

          {/* Service & Location */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Service Details
            </h3>
            <div className="space-y-2">
              <p className="text-gray-900 dark:text-white font-medium capitalize">
                {order.serviceType === "dine-in" ? "Dine In" : order.serviceType}
              </p>
              {order.serviceType === "dine-in" && order.tableNumber && (
                <p className="text-gray-600 dark:text-gray-400">
                  Table #{order.tableNumber}
                </p>
              )}
              {order.serviceType === "delivery" && order.deliveryAddress && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {order.deliveryAddress}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Items ({order.items?.length || 0})
          </h3>
          <div className="space-y-2">
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start text-sm py-2"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    x{item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  EGP {item.totalPrice?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total & Payment Info */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>EGP {order.subtotal?.toFixed(2) || 0}</span>
          </div>
          {order.vat > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>VAT (15%)</span>
              <span>EGP {order.vat?.toFixed(2) || 0}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span>EGP {order.totalAmount?.toFixed(2) || 0}</span>
          </div>
          
          {/* Payment Status */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Payment Status
              </span>
              <span
                className={`text-sm font-semibold capitalize px-3 py-1 rounded-full border ${
                  order.paymentStatus === "paid"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/orders/${order._id}`)}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
          >
            View Details
          </button>

          {/* Cancel Button - Only show for pending/confirmed */}
          {["pending", "confirmed"].includes(order.status) && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="py-3 px-4 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Cancel Order?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel order {order.orderNumber}? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={canceling}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {canceling ? "Canceling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
