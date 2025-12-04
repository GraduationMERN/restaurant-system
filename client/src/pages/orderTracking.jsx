// src/pages/OrderTracking.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById, cancelOwnOrder } from "../redux/slices/orderSlice";
import { CheckCircle, Clock, X } from "lucide-react";
import { ArrowLeft } from "lucide-react";

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useParams();
  const dispatch = useDispatch();
  const { orderId: paramOrderId } = params;
  const orderData = location.state?.order;
  const locationOrderId = location.state?.orderId;

  const { singleOrder, loading: orderLoading } = useSelector((s) => s.order || {});

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const idToLoad = paramOrderId || locationOrderId;
    if (orderData) {
      setOrderDetails(orderData);
      setLoading(false);
      setError(null);
      return;
    }

    if (idToLoad) {
      setLoading(true);
      setError(null);
      dispatch(fetchOrderById(idToLoad))
        .unwrap()
        .then((res) => {
          // response may be { success:true, data: order }
          const payload = res?.data || res;
          setOrderDetails(payload);
        })
        .catch((err) => {
          console.error("Failed to load order", err);
          setError("Unable to load order. Please try again.");
        })
        .finally(() => setLoading(false));
    } else {
      setError("No order found.");
      setLoading(false);
    }
  }, [paramOrderId, locationOrderId, orderData, dispatch]);

  // Keep local details in sync with Redux singleOrder updates (e.g., socket)
  useEffect(() => {
    if (!orderData && singleOrder && singleOrder._id) {
      const idToMatch = paramOrderId || locationOrderId;
      if (!idToMatch || singleOrder._id === idToMatch) {
        setOrderDetails(singleOrder);
      }
    }
  }, [singleOrder, orderData, paramOrderId, locationOrderId]);

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

  if (loading || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 dark:text-red-400 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/menu")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Go to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-6">Order not found.</p>
          <button
            onClick={() => navigate("/menu")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Go to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
     
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/menu")}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Tracking Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 text-center">

          {/* Branch Info */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="font-medium text-blue-800 dark:text-blue-300">
              Branch: <span className="font-bold">{orderDetails?.branchName || orderDetails?.branch || "-"}</span>
            </p>
          </div>

          {/* Order Progress */}
          <div className="flex justify-between items-center mb-10 relative">
            {/* Pending */}
            <div className="flex flex-col items-center relative z-10">
              <div className="h-12 w-12 bg-orange-500 dark:bg-orange-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="mt-2 font-medium text-gray-900 dark:text-white">Pending</span>
            </div>

            {/* Line 1 */}
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-4 relative">
              <div className="absolute top-0 left-0 h-full bg-orange-500 dark:bg-orange-400 w-1/2"></div>
            </div>

            {/* Confirmed */}
            <div className="flex flex-col items-center relative z-10">
              <div className="h-12 w-12 bg-orange-500 dark:bg-orange-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="mt-2 font-medium text-gray-900 dark:text-white">Confirmed</span>
            </div>

            {/* Line 2 */}
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-4"></div>

            {/* Ready */}
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <span className="mt-2 font-medium text-gray-500 dark:text-gray-400">Ready</span>
            </div>
          </div>

          {/* Estimated Time */}
          {orderDetails?.estimatedTime && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {orderDetails.estimatedTime} mins
              </span>
              <span className="text-gray-600 dark:text-gray-400">remaining</span>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-400">
            We'll notify you once your order is ready.
          </p>

          {/* Cancel Order Button - Only show if status is pending */}
          {orderDetails?.status === "pending" && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCanceling}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="h-5 w-5" />
                {isCanceling ? "Canceling..." : "Cancel Order"}
              </button>
            </div>
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
      </div>
    </div>
  );
};

export default OrderTracking;
