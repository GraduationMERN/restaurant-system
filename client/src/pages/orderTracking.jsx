// src/pages/OrderTracking.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Clock } from "lucide-react";
import { ArrowLeft } from "lucide-react";

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const orderData = location.state?.order;
  const orderId = location.state?.orderId;

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrderDetails({
        orderNumber: orderData?.orderNumber || `ORD-${Date.now()}`,
        estimatedTime: 25,
      });
      setLoading(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [orderData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tracking...</p>
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
              Branch: <span className="font-bold">{orderDetails.branchName}</span>
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {orderDetails.estimatedTime} mins
            </span>
            <span className="text-gray-600 dark:text-gray-400">remaining</span>
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            We'll notify you once your order is ready.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
