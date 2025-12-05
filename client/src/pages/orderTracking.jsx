import React, { useEffect, useState, useRef } from "react";
import { useToast } from "../hooks/useToast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById, cancelOwnOrder, upsertOrder } from "../redux/slices/orderSlice";
import socketClient from "../utils/socketRedux";
import { 
  CheckCircle, 
  Clock, 
  X, 
  Package,
  ArrowLeft,
  MapPin,
  User,
  Phone,
  CreditCard,
  ChefHat,
  AlertCircle
} from "lucide-react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const dispatch = useDispatch();
  
  // Get order ID from URL or location state
  const { id: orderId } = params;
  const orderData = location.state?.order;
  
  // Local state
  const [orderDetails, setOrderDetails] = useState(orderData || null);
  const [loading, setLoading] = useState(!orderData);
  const [error, setError] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const timerRef = useRef(null);
  const toast = useToast();
  const countdownFiredRef = useRef(false);

  // Fetch order by ID on mount if not provided
  useEffect(() => {
    if (orderData) {
      setOrderDetails(orderData);
      setLoading(false);
      return;
    }

    if (!orderId) {
      setError("Order ID not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    dispatch(fetchOrderById(orderId))
      .unwrap()
      .then((res) => {
        const payload = res?.data || res;
        setOrderDetails(payload);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load order", err);
        setError("Unable to load order. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, orderData, dispatch]);

  // Socket: listen to real-time updates for THIS order
  useEffect(() => {
    if (!orderId) return;
    
    const s = socketClient.getSocket() || socketClient.initSocket();
    if (!s) return;

    const handleOrderUpdate = (updatedOrder) => {
      // Only update if this is our order
      if (updatedOrder._id === orderId || updatedOrder.orderNumber === orderDetails?.orderNumber) {
        setOrderDetails(updatedOrder);
      }
    };

    // Listen to ALL order events
    s.on("order:updated", handleOrderUpdate);
    s.on("order:status-changed", handleOrderUpdate);
    s.on("order:payment-updated", handleOrderUpdate);
    s.on("order:confirmed", handleOrderUpdate);
    s.on("order:preparing", handleOrderUpdate);
    s.on("order:ready", handleOrderUpdate);
    s.on("order:completed", handleOrderUpdate);
    s.on("order:refunded", handleOrderUpdate);
    s.on("order:cashier-notification", (payload) => {
      const order = payload?.order || payload;
      if (order && (order._id === orderId)) {
        setOrderDetails(order);
      }
    });
    s.on("order:estimatedTime", (payload) => {
      if (payload?.orderId === orderId) {
        // Update estimated time
        setOrderDetails(prev => ({
          ...prev,
          estimatedTime: payload.minutes,
          estimatedReadyTime: payload.readyTime
        }));
      }
    });
    s.on("order:deleted", (payload) => {
      const deletedId = payload?.orderId || payload?._id || payload;
      if (deletedId === orderId) {
        setError("This order has been deleted");
        setOrderDetails(null);
      }
    });

    // Cleanup
    return () => {
      s.off("order:updated", handleOrderUpdate);
      s.off("order:status-changed", handleOrderUpdate);
      s.off("order:payment-updated", handleOrderUpdate);
      s.off("order:confirmed", handleOrderUpdate);
      s.off("order:preparing", handleOrderUpdate);
      s.off("order:ready", handleOrderUpdate);
      s.off("order:completed", handleOrderUpdate);
      s.off("order:refunded", handleOrderUpdate);
      s.off("order:cashier-notification");
      s.off("order:estimatedTime");
      s.off("order:deleted");
    };
  }, [orderId, orderDetails?.orderNumber]);

  // Start / update countdown when estimatedReadyTime is set
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const ready = orderDetails?.estimatedReadyTime;
    if (!ready) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const readyTime = new Date(ready).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((readyTime - now) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    updateRemaining();
    timerRef.current = setInterval(updateRemaining, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [orderDetails?.estimatedReadyTime]);

  // Notify when countdown finishes (only once)
  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0 && !countdownFiredRef.current) {
      countdownFiredRef.current = true;
      try {
        toast.showToast({ message: "Your order should be ready now — please check with the cashier.", type: "success", duration: 6000 });
      } catch (e) {
        // ignore if toast unavailable
        console.warn("Toast error:", e);
      }
    }
  }, [remainingSeconds, toast]);

  const handleCancelOrder = async () => {
    if (!orderDetails?._id) {
      alert("Cannot cancel order: Order ID not found");
      return;
    }

    setIsCanceling(true);
    try {
      const result = await dispatch(cancelOwnOrder(orderDetails._id)).unwrap();
      setOrderDetails(result?.data || result);
      setShowCancelConfirm(false);
      alert("Order cancelled successfully");
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert("Failed to cancel order: " + (err?.message || "Please try again"));
    } finally {
      setIsCanceling(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEstimatedTime = () => {
    if (orderDetails?.estimatedReadyTime) {
      const readyTime = new Date(orderDetails.estimatedReadyTime);
      return formatTime(readyTime);
    }
    
    if (orderDetails?.estimatedTime) {
      const now = new Date();
      const readyTime = new Date(now.getTime() + (orderDetails.estimatedTime * 60000));
      return formatTime(readyTime);
    }
    
    return "05:49";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 dark:text-red-400 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The order you're looking for doesn't exist or has been removed."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/orders")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to My Orders
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Order Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {orderDetails.orderNumber}
              </h2>
              <span className={`px-4 py-2 rounded-full font-medium capitalize ${
                orderDetails.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" :
                orderDetails.status === "confirmed" ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" :
                orderDetails.status === "preparing" ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" :
                orderDetails.status === "ready" ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300" :
                orderDetails.status === "completed" ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" :
                "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              }`}>
                {orderDetails.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Order Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(orderDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Service Type</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {orderDetails.serviceType}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Payment Status</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {orderDetails.paymentStatus}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Order Total</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  EGP {(orderDetails.totalAmount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Progress */}
          {["pending", "confirmed", "preparing", "ready"].includes(orderDetails.status) && (
            <>
              <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Progress</h3>
                <div className="flex justify-between items-center">
                  {["pending", "confirmed", "preparing", "ready"].map((status, idx) => (
                    <div key={status} className="flex flex-col items-center flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${
                        ["pending", "confirmed", "preparing", "ready"].indexOf(orderDetails.status) >= idx
                          ? "bg-orange-500 dark:bg-orange-400"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}>
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Estimated Ready Time</p>
                    <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {remainingSeconds == null ? (
                                <span>{orderDetails.estimatedTime || "5-10"} mins</span>
                              ) : (
                                <span className="tabular-nums">
                                  {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                    </div>
                  </div>
                  {orderDetails.estimatedReadyTime && (
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Ready at</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getEstimatedTime()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Order Items */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>
            <div className="space-y-2">
              {orderDetails.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.quantity}x {item.name}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    EGP {(item.totalPrice || item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>EGP {(orderDetails.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>VAT (14%)</span>
              <span>EGP {(orderDetails.vat || 0).toFixed(2)}</span>
            </div>
            {orderDetails.deliveryFee > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery Fee</span>
                <span>EGP {(orderDetails.deliveryFee || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2">
              <span>Total</span>
              <span>EGP {(orderDetails.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Address */}
          {orderDetails.deliveryLocation && (
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Delivery Address</h3>
              <p className="text-gray-600 dark:text-gray-400">{orderDetails.deliveryLocation.address}</p>
            </div>
          )}

          {/* Cancel Button */}
          {orderDetails.status === "pending" && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={isCanceling}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X className="h-5 w-5" />
              {isCanceling ? "Canceling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Cancel Order?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isCanceling ? "Canceling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;