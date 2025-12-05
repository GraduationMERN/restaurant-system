// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import PageBreadcrumb from "../components/common/PageBreadCrumb";
// import PageMeta from "../components/common/PageMeta";
// import { fetchUserOrders } from "../redux/slices/orderSlice";
// import socketClient from "../utils/socket";
// import { upsertOrder } from "../redux/slices/orderSlice";
// import { useNavigate } from "react-router-dom";

// export default function OrderHistory() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { userOrders, loading, error } = useSelector((state) => state.order || {});

//   useEffect(() => {
//     dispatch(fetchUserOrders());
//   }, [dispatch]);

//   // Subscribe to socket updates so history refreshes in real-time
//   useEffect(() => {
//     const s = socketClient.getSocket() || socketClient.initSocket();
//     if (!s) return;

//     const handleUpdated = (order) => {
//       try {
//         dispatch(upsertOrder(order));
//         // If this order belongs to current user, refresh list
//         const userId = order?.customerId;
//         if (userId) dispatch(fetchUserOrders(userId));
//       } catch (e) {}
//     };

//     s.on("order:created", handleUpdated);
//     s.on("order:updated", handleUpdated);
//     s.on("order:update", handleUpdated);
//     s.on("order:paid", handleUpdated);
//     s.on("order:confirmed", handleUpdated);
//     s.on("order:ready", handleUpdated);
//     s.on("order:completed", handleUpdated);
//     s.on("order:refunded", handleUpdated);
//     s.on("order:deleted", (payload) => {
//       const id = payload && (payload.orderId || payload._id || payload);
//       if (id) {
//         dispatch({ type: deleteOrder.fulfilled.type, payload: id });
//       }
//     });

//     return () => {
//       s.off("order:created", handleUpdated);
//       s.off("order:updated", handleUpdated);
//       s.off("order:confirmed", handleUpdated);
//       s.off("order:ready", handleUpdated);
//       s.off("order:completed", handleUpdated);
//       s.off("order:refunded", handleUpdated);
//     };
//   }, [dispatch]);

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
//       <PageMeta title="Order History" description="Your past orders" />
//       <PageBreadcrumb pageTitle="My Orders" />

//       <div className="max-w-5xl mx-auto px-4 py-6">
//         <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
//           <h2 className="text-lg font-semibold mb-4">Order History</h2>

//           {loading && <p className="text-gray-500">Loading...</p>}
//           {error && <p className="text-red-500">{error}</p>}

//           {!loading && userOrders && userOrders.length === 0 && (
//             <p className="text-gray-500">You have no past orders</p>
//           )}

//           {!loading && userOrders && userOrders.length > 0 && (
//             <div className="space-y-4">
//               {userOrders.map((order) => (
//                 <div key={order._id} className="p-4 border rounded-lg hover:shadow-sm">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <div className="text-sm text-gray-500">Order</div>
//                       <div className="font-mono font-semibold">{order._id}</div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-sm text-gray-500">Status</div>
//                       <div className="font-medium capitalize">{order.status}</div>
//                     </div>
//                   </div>

//                   <div className="mt-3 flex justify-between items-center">
//                     <div className="text-sm text-gray-600">Items: {order.items?.length || 0}</div>
//                     <div className="text-sm font-semibold">EGP {(order.totalAmount || 0).toFixed(2)}</div>
//                   </div>

//                   <div className="mt-4 flex gap-2 justify-end">
//                     <button
//                       onClick={() => navigate(`/track-order/${order._id}`, { state: { order, orderId: order._id } })}
//                       className="px-3 py-2 rounded bg-orange-500 text-white"
//                     >
//                       Track
//                     </button>
//                     <button
//                       onClick={() => navigate(`/orders/${order._id}`)}
//                       className="px-3 py-2 rounded border"
//                     >
//                       Details
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
// src/pages/OrderHistory.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { fetchUserOrders, upsertOrder, cancelOwnOrder } from "../redux/slices/orderSlice";
import socketClient from "../utils/socketRedux";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { Package, Clock } from "lucide-react";

export default function OrderHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const toast = useToast();
  // Get user from auth state
  const { user } = useSelector((state) => state.auth || {});
  const { userOrders, loading, error } = useSelector((state) => state.order || {});
  
  const [activeTab, setActiveTab] = useState("current"); // "current" or "history"

  // Fetch user's orders on mount - PASS USER ID
  useEffect(() => {
  dispatch(fetchUserOrders());  // The thunk will get userId from state
}, [dispatch]);

  // Subscribe to socket updates
  useEffect(() => {
    if (!user?._id) return;
    
    const s = socketClient.getSocket() || socketClient.initSocket();
    if (!s) return;

    const handleUpdated = (order) => {
      try {
        dispatch(upsertOrder(order));
        // If this order belongs to current user, refresh list
        if (order?.customerId === user._id) {
          dispatch(fetchUserOrders(user._id));
          if (order.paymentStatus === 'paid') {
            toast.showToast({ message: `Payment received for order ${order.orderNumber || order._id}`, type: 'success' });
          }
        }
      } catch (e) {
        console.error("Socket update error:", e);
      }
    };

    s.on("order:created", handleUpdated);
    s.on("order:updated", handleUpdated);
    s.on("order:update", handleUpdated);
    s.on("order:paid", handleUpdated);
    s.on("order:confirmed", handleUpdated);
    s.on("order:ready", handleUpdated);
    s.on("order:completed", handleUpdated);
    s.on("order:refunded", handleUpdated);
    s.on("order:deleted", (payload) => {
      const id = payload?.orderId || payload?._id || payload;
      if (id) {
        // Force refresh user orders
        dispatch(fetchUserOrders(user._id));
      }
    });

    // Also listen for customer-specific payment updates
    const handleYourPayment = (order) => {
      if (order?.customerId === user._id) {
        // Refresh and notify
        dispatch(fetchUserOrders(user._id));
        toast.showToast({ message: `Payment updated for order ${order.orderNumber || order._id}`, type: 'success' });
      }
    };
    s.on("order:your-payment-updated", handleYourPayment);

    return () => {
      s.off("order:created", handleUpdated);
      s.off("order:updated", handleUpdated);
      s.off("order:update", handleUpdated);
      s.off("order:paid", handleUpdated);
      s.off("order:confirmed", handleUpdated);
      s.off("order:ready", handleUpdated);
      s.off("order:completed", handleUpdated);
      s.off("order:refunded", handleUpdated);
      s.off("order:deleted");
      s.off("order:your-payment-updated", handleYourPayment);
    };
  }, [dispatch, user?._id]);

  // Filter orders based on active tab
  const currentOrders = userOrders?.filter(o => 
    ["pending", "confirmed", "preparing", "ready"].includes(o.status)
  ) || [];
  
  const previousOrders = userOrders?.filter(o => 
    ["completed", "cancelled", "canceled", "refunded"].includes(o.status)
  ) || [];

  // Cancel order (only if pending and belongs to user)
  const handleCancel = async (orderId) => {
    if (!orderId) return;
    const ok = window.confirm("Are you sure you want to cancel this order?");
    if (!ok) return;
    try {
      await dispatch(cancelOwnOrder(orderId)).unwrap();
      // Refresh user's orders
      dispatch(fetchUserOrders(user._id));
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err?.message || "Failed to cancel order. Please try again.");
    }
  };

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <PageMeta title="Order History" description="Your past orders" />
        <PageBreadcrumb pageTitle="My Orders" />
        
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Please Log In
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be logged in to view your order history.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <PageMeta title="My Orders" description="Your order history and active orders" />
      <PageBreadcrumb pageTitle="My Orders" />

      <div className="max-w-6xl mx-auto px-4 py-6">
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Current Orders Tab */}
            {activeTab === "current" && (
              <div className="space-y-4">
                {currentOrders.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
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
                      onTrack={() => navigate(`/track-order/${order._id}`, { state: { order } })}
                      onCancel={() => handleCancel(order._id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-4">
                {previousOrders.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">No order history</p>
                  </div>
                ) : (
                  previousOrders.map((order) => (
                    <OrderCard 
                      key={order._id} 
                      order={order} 
                      onTrack={() => navigate(`/track-order/${order._id}`, { state: { order } })}
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
}

// Order Card Component
const OrderCard = ({ order, onTrack, onCancel }) => {
  const statusColors = {
    pending: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
    confirmed: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    preparing: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
    ready: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
    completed: "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    cancelled: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
    canceled: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
    refunded: "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {order.orderNumber || `#${order._id?.substring(0, 8).toUpperCase()}`}
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
        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-orange-500">{order.items?.length || 0}</p>
          <p className="text-xs text-gray-500">items</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        {(["pending", "confirmed", "preparing", "ready"].includes(order.status)) ? (
          <>
            <button
              onClick={onTrack}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Track Order
            </button>
            {order.status === "pending" && onCancel && (
              <button
                onClick={() => onCancel(order._id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onTrack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};