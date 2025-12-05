// src/pages/OrderTracking.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById, fetchUserOrders, cancelOwnOrder, upsertOrder, fetchActiveOrders } from "../redux/slices/orderSlice";
import socketClient from "../utils/socket";
import { CheckCircle, Clock, X, Package } from "lucide-react";
import { ArrowLeft } from "lucide-react";

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const dispatch = useDispatch();
  
  // Redux selectors
  const { user } = useSelector((state) => state.auth || {});
  const { singleOrder, userOrders, loading: orderLoading } = useSelector((s) => s.order || {});
  
  // Route params
  const { id: paramOrderId } = params;
  const orderData = location.state?.order;
  const locationOrderId = location.state?.orderId;

  // Local state
  const [orderDetails, setOrderDetails] = useState(null);
  const [allUserOrders, setAllUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // current or history

  // Fetch user's orders on mount
  useEffect(() => {
    if (user && user._id) {
      setLoading(true);
      dispatch(fetchUserOrders(user._id))
        .unwrap()
        .then((res) => {
          const orders = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          setAllUserOrders(orders);
        })
        .catch((err) => {
          console.error("Failed to load user orders:", err);
          setError("Unable to load your orders.");
        })
        .finally(() => setLoading(false));
    } else {
      // User not authenticated, check if we have an orderId to load
      const idToLoad = paramOrderId || locationOrderId;
      if (orderData) {
        setOrderDetails(orderData);
        setLoading(false);
        return;
      }

      if (idToLoad) {
        setLoading(true);
        dispatch(fetchOrderById(idToLoad))
          .unwrap()
          .then((res) => {
            const payload = res?.data || res;
            setOrderDetails(payload);
          })
          .catch((err) => {
            console.error("Failed to load order", err);
            setError("Unable to load order. Please try again.");
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [user?._id, dispatch]);

  // When orderData from location changes, update current order
  useEffect(() => {
    if (orderData) {
      setOrderDetails(orderData);
      return;
    }

    // Otherwise, try to load by ID
    const idToLoad = paramOrderId || locationOrderId;
    if (idToLoad && !orderData) {
      dispatch(fetchOrderById(idToLoad))
        .unwrap()
        .then((res) => {
          const payload = res?.data || res;
          setOrderDetails(payload);
        })
        .catch((err) => {
          console.error("Failed to load order", err);
          setError("Unable to load order. Please try again.");
        });
    }
  }, [paramOrderId, locationOrderId, orderData, dispatch]);

  // Keep local details in sync with Redux updates (socket events)
  useEffect(() => {
    if (singleOrder && singleOrder._id) {
      const idToMatch = paramOrderId || locationOrderId;
      if (!idToMatch || singleOrder._id === idToMatch) {
        setOrderDetails(singleOrder);
      }
    }
  }, [singleOrder, paramOrderId, locationOrderId]);

  // Socket: listen to order lifecycle events to update UI in real-time
  useEffect(() => {
    const s = socketClient.getSocket() || socketClient.initSocket();
    if (!s) return;

    const handleOrderCreated = (order) => {
      // If it's for current user, refresh their orders; otherwise upsert
      try { console.log('[socket] order:created', order); } catch(e){}
      if (user && order.customerId === user._id) {
        dispatch(fetchUserOrders(user._id));
      }
      dispatch(upsertOrder(order));
      // Refresh active orders for staff views
      dispatch(fetchActiveOrders());
    };

    const handleOrderUpdated = (order) => {
      try { console.log('[socket] order:updated', order); } catch(e){}
      dispatch(upsertOrder(order));
      if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
      dispatch(fetchActiveOrders());
    };

    const handleOrderConfirmed = (order) => {
      try { console.log('[socket] order:confirmed', order); } catch(e){}
      dispatch(upsertOrder(order));
      if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
      dispatch(fetchActiveOrders());
    };

    const handleOrderReady = (order) => {
      try { console.log('[socket] order:ready', order); } catch(e){}
      dispatch(upsertOrder(order));
      dispatch(fetchActiveOrders());
    };

    const handleOrderCompleted = (order) => {
      try { console.log('[socket] order:completed', order); } catch(e){}
      dispatch(upsertOrder(order));
      if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
      dispatch(fetchActiveOrders());
    };

    const handleOrderRefunded = (order) => {
      try { console.log('[socket] order:refunded', order); } catch(e){}
      dispatch(upsertOrder(order));
      if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
    };

    const handleStatusUpdated = (order) => {
      try { console.log('[socket] order:status-updated', order); } catch(e){}
      dispatch(upsertOrder(order));
      if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
      dispatch(fetchActiveOrders());
    };

    const handlePaymentUpdated = (order) => {
      try { console.log('[socket] order:payment-updated', order); } catch(e){}
      dispatch(upsertOrder(order));
      if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
      dispatch(fetchActiveOrders());
    };

    const handleAssignedToCashier = (order) => {
      try { console.log('[socket] order:assigned-to-cashier', order); } catch(e){}
      // order might be partial; upsert and refresh lists
      dispatch(upsertOrder(order));
      dispatch(fetchActiveOrders());
      if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
    };

    const handleCashierNotification = (payload) => {
      try { console.log('[socket] order:cashier-notification', payload); } catch(e){}
      // payload may include { order, message }
      const order = payload && (payload.order || payload);
      if (order) {
        dispatch(upsertOrder(order));
        if (user && order.customerId === user._id) dispatch(fetchUserOrders(user._id));
      }
    };

    s.on("order:created", handleOrderCreated);
    s.on("order:updated", handleOrderUpdated);
    s.on("order:update", handleOrderUpdated);
    s.on("order:paid", handleOrderUpdated);
    s.on("order:status-updated", handleStatusUpdated);
    s.on("order:payment-updated", handlePaymentUpdated);
    s.on("order:assigned-to-cashier", handleAssignedToCashier);
    s.on("order:cashier-notification", handleCashierNotification);
    s.on("order:deleted", (payload) => {
      // payload may be { orderId } or the order object
      const id = payload && (payload.orderId || payload._id || payload);
      if (id) {
        // remove from user orders locally by refetch
        if (user && user._id) dispatch(fetchUserOrders(user._id));
        dispatch({ type: 'order/delete/fulfilled', payload: id });
      }
    });
    s.on("order:estimatedTime", (payload) => {
      if (payload && payload.orderId) {
        // fetch that order to get fresh ETA
        dispatch(fetchOrderById(payload.orderId));
      }
    });
    s.on("order:confirmed", handleOrderConfirmed);
    s.on("order:ready", handleOrderReady);
    s.on("order:completed", handleOrderCompleted);
    s.on("order:refunded", handleOrderRefunded);

    return () => {
      s.off("order:created", handleOrderCreated);
      s.off("order:updated", handleOrderUpdated);
      s.off("order:update", handleOrderUpdated);
      s.off("order:paid", handleOrderUpdated);
      s.off("order:status-updated", handleStatusUpdated);
      s.off("order:payment-updated", handlePaymentUpdated);
      s.off("order:assigned-to-cashier", handleAssignedToCashier);
      s.off("order:cashier-notification", handleCashierNotification);
      s.off("order:deleted");
      s.off("order:estimatedTime");
      s.off("order:confirmed", handleOrderConfirmed);
      s.off("order:ready", handleOrderReady);
      s.off("order:completed", handleOrderCompleted);
      s.off("order:refunded", handleOrderRefunded);
    };
  }, [dispatch, user]);

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

  // Get current/active orders and previous orders
  const currentOrders = allUserOrders.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status));
  const previousOrders = allUserOrders.filter(o => ["completed", "cancelled", "canceled"].includes(o.status));

  // If viewing a specific order by ID or from location state
  const viewingOrder = orderDetails || (paramOrderId ? allUserOrders.find(o => o._id === paramOrderId) : null);

  if (loading || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your orders...</p>
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
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => navigate("/menu")}
              className="mt-3 text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              Go to Menu
            </button>
          </div>
        )}

        {/* If viewing a specific order */}
        {viewingOrder ? (
          <CurrentOrderCard 
            order={viewingOrder}
            isCanceling={isCanceling}
            showCancelConfirm={showCancelConfirm}
            setShowCancelConfirm={setShowCancelConfirm}
            handleCancelOrder={handleCancelOrder}
            onBack={() => {
              setOrderDetails(null);
              setActiveTab("current");
            }}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("current")}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === "current"
                    ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Active Orders ({currentOrders.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === "history"
                    ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Order History ({previousOrders.length})
                </div>
              </button>
            </div>

            {/* Current Orders Tab */}
            {activeTab === "current" && (
              <div className="space-y-4">
                {currentOrders.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No active orders</p>
                    <button
                      onClick={() => navigate("/menu")}
                      className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-medium"
                    >
                      Browse our menu
                    </button>
                  </div>
                ) : (
                  currentOrders.map((order) => (
                    <OrderCard 
                      key={order._id} 
                      order={order} 
                      onClick={() => setOrderDetails(order)}
                    />
                  ))
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-4">
                {previousOrders.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No order history</p>
                  </div>
                ) : (
                  previousOrders.map((order) => (
                    <OrderCard 
                      key={order._id} 
                      order={order}
                      onClick={() => setOrderDetails(order)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Compact Order Card (for list view)
const OrderCard = ({ order, onClick }) => {
  const statusColors = {
    pending: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
    confirmed: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    preparing: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
    ready: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
    completed: "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    cancelled: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all text-left border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {order.orderNumber}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || statusColors.pending}`}>
              {order.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Order Date</p>
              <p>{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Total</p>
              <p className="font-semibold text-gray-900 dark:text-white">EGP {(order.totalAmount || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-500">{order.items?.length || 0}</p>
          <p className="text-xs text-gray-500">items</p>
        </div>
      </div>
    </button>
  );
};

// Full Order Details Card (when clicked)
const CurrentOrderCard = ({ 
  order, 
  isCanceling, 
  showCancelConfirm, 
  setShowCancelConfirm, 
  handleCancelOrder,
  onBack 
}) => {
  return (
    <>
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Order Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {order.orderNumber}
            </h2>
            <span className={`px-4 py-2 rounded-full font-medium capitalize ${
              order.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" :
              order.status === "confirmed" ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" :
              order.status === "preparing" ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" :
              order.status === "ready" ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300" :
              order.status === "completed" ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" :
              "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            }`}>
              {order.status}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Order Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Service Type</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {order.serviceType}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Payment Status</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Order Progress */}
        {["pending", "confirmed", "preparing", "ready"].includes(order.status) && (
          <>
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Progress</h3>
              <div className="flex justify-between items-center">
                {["pending", "confirmed", "preparing", "ready"].map((status, idx) => (
                  <div key={status} className="flex flex-col items-center flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${
                      ["pending", "confirmed", "preparing", "ready"].indexOf(order.status) >= idx
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
            {order.estimatedTime && (
              <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Estimated Ready Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {order.estimatedTime} mins
                      </span>
                    </div>
                  </div>
                  {order.estimatedReadyTime && (
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Ready at</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(order.estimatedReadyTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Order Items */}
        <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>
          <div className="space-y-2">
            {order.items?.map((item, idx) => (
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
            <span>EGP {(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>VAT (14%)</span>
            <span>EGP {(order.vat || 0).toFixed(2)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span>EGP {(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2">
            <span>Total</span>
            <span>EGP {(order.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery Address */}
        {order.deliveryLocation && (
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Delivery Address</h3>
            <p className="text-gray-600 dark:text-gray-400">{order.deliveryLocation.address}</p>
          </div>
        )}

        {/* Cancel Button */}
        {order.status === "pending" && (
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
    </>
  );
};

export default OrderTracking;
