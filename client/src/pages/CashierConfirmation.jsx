// src/pages/CashierConfirmation.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, Home, Receipt, Phone, Star } from "lucide-react";
import { ArrowLeft } from "lucide-react";


const CashierConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const orderData = location.state?.order;
  const orderId = location.state?.orderId;
  
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading order details
    const timer = setTimeout(() => {
      setOrderDetails({
        orderNumber: orderData?.orderNumber || `ORD-${Date.now()}`,
        estimatedTime: 25,
        branchName: "El Shatby Outlet",
        items: [
          { name: "Turkish Coffee Single", quantity: 2, price: 80 }
        ],
        totalAmount: 160
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [orderData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Confirmation Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Order Confirmed!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Order confirmed! Kindly pay at the cashier.
          </p>

          {/* Branch Info */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="font-medium text-blue-800 dark:text-blue-300">
              From Branch: <span className="font-bold">{orderDetails.branchName}</span>
            </p>
          </div>

          {/* Order Progress */}
          <div className="flex justify-between items-center mb-8 relative">
            <div className="flex flex-col items-center relative z-10">
              <div className="h-12 w-12 bg-orange-500 dark:bg-orange-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="mt-2 font-medium text-gray-900 dark:text-white">Pending</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-4 relative">
              <div className="absolute top-0 left-0 h-full bg-orange-500 dark:bg-orange-400 w-1/2"></div>
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="h-12 w-12 bg-orange-500 dark:bg-orange-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="mt-2 font-medium text-gray-900 dark:text-white">Confirmed</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-4"></div>
            
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <span className="mt-2 font-medium text-gray-500 dark:text-gray-400">Ready</span>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">05:49</span>
            <span className="text-gray-600 dark:text-gray-400">Estimated ready time</span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We will let you know when your order is ready.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <button 
              onClick={() => window.location.href = "tel:+1234567890"}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-orange-500 dark:border-orange-400 text-orange-500 dark:text-orange-400 rounded-xl font-medium hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Call the restaurant
            </button>
            
            <button 
              onClick={() => navigate("/reviews")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 dark:bg-orange-400 text-white rounded-xl font-medium hover:bg-orange-600 dark:hover:bg-orange-500 transition-colors"
            >
              <Star className="h-5 w-5" />
              Rate your experience
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Order #{orderDetails.orderNumber}
          </h2>
          
          <div className="space-y-3 mb-6">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  EGP {item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">EGP {orderDetails.totalAmount}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">VAT</span>
              <span className="font-medium text-gray-900 dark:text-white">EGP 0</span>
            </div>
            <div className="flex justify-between py-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-lg font-bold text-orange-500 dark:text-orange-400">EGP {orderDetails.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Go to Menu Button */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-orange-500 dark:bg-orange-400 text-white rounded-xl font-bold text-lg hover:bg-orange-600 dark:hover:bg-orange-500 transition-colors w-full max-w-md"
          >
            Go to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierConfirmation;