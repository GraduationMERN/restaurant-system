// src/pages/PaymentPage.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createStripeSession, payInStore } from "../redux/slices/paymentSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Store, CheckCircle } from "lucide-react";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Debug: Log the full location state to see what's being passed
  console.log("PaymentPage - location.state:", location.state);
  
  // Get order from navigation state - handle both response structures
  const orderResponse = location.state?.order;
  const orderData = orderResponse?.data || orderResponse; // Try .data first, then the whole response
  const orderId = location.state?.orderId || orderData?.id || orderData?._id;
  
  console.log("PaymentPage - orderResponse:", orderResponse);
  console.log("PaymentPage - orderData:", orderData);
  console.log("PaymentPage - orderId:", orderId);
  
  // Get cart data as fallback
  const { products = [], totalPrice = 0 } = useSelector((state) => state.cart || {});
  const paymentState = useSelector((state) => state.payment || {});
  const { loading = false, error = null, stripeSession = null } = paymentState;
  
  // State
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [branchName, setBranchName] = useState("El Shatby Outlet");
  const [localError, setLocalError] = useState("");

  // Handle stripe redirect
  useEffect(() => {
    if (stripeSession?.url) {
      window.location.href = stripeSession.url;
    }
  }, [stripeSession]);

  // Check for orderId on component mount
  useEffect(() => {
    if (!orderId) {
      console.error("No orderId found. Location state:", location.state);
      setLocalError("Order not found. Please complete checkout first.");
      
      // Redirect after 3 seconds
      const timer = setTimeout(() => {
        navigate("/checkout");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [orderId, navigate, location.state]);

  // Handle payment
  const handlePayment = async () => {
    if (!orderId) {
      setLocalError("Order not found. Please complete checkout first.");
      return;
    }

    try {
      if (paymentMethod === "online") {
        await dispatch(createStripeSession({ orderId })).unwrap();
      } else {
        await dispatch(payInStore({ orderId })).unwrap();
        // After marking as pay-in-store, go to the order tracking page with orderId in URL
        navigate(`/orders/${orderId}`, {
          state: {
            orderId,
            order: orderData,
          },
        });
      }
    } catch (err) {
      console.error("Payment failed:", err);
      setLocalError(err.message || "Payment failed. Please try again.");
    }
  };

  // If there's an error with orderId, show error message
  if (localError && !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 dark:text-red-400 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{localError}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Redirecting to checkout in a few seconds...
          </p>
          <button
            onClick={() => navigate("/checkout")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Go to Checkout Now
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals - use order data if available, otherwise use cart
  const orderItems = orderData?.items || products;
  const subtotal = orderData?.subtotal || orderData?.totalAmount || totalPrice;
  const vat = orderData?.vat || 0;
  const total = subtotal + vat;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Order ID Display */}
        {orderId && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-blue-800 dark:text-blue-300 text-center font-medium">
              Order Reference: <span className="font-bold">{orderId}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Branch Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Branch</h2>
              <div className="flex items-start">
                <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg p-3 mr-4">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">From Branch:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{branchName}</p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Payment Methods</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Online Payment Option */}
                <button
                  onClick={() => setPaymentMethod("online")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === "online"
                      ? "border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${
                      paymentMethod === "online"
                        ? "bg-orange-500 dark:bg-orange-400 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${
                        paymentMethod === "online"
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        Online
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pay securely online</p>
                    </div>
                    {paymentMethod === "online" && (
                      <div className="ml-auto">
                        <CheckCircle className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                      </div>
                    )}
                  </div>
                </button>

                {/* In-store Payment Option */}
                <button
                  onClick={() => setPaymentMethod("instore")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === "instore"
                      ? "border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${
                      paymentMethod === "instore"
                        ? "bg-orange-500 dark:bg-orange-400 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      <Store className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${
                        paymentMethod === "instore"
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        In-store
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pay at the cashier</p>
                    </div>
                    {paymentMethod === "instore" && (
                      <div className="ml-auto">
                        <CheckCircle className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Notification Message */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-blue-800 dark:text-blue-300 text-center">
                  We will notify you once your order is ready.{" "}
                  {paymentMethod === "instore" && (
                    <span className="font-semibold">Kindly pay at the cashier.</span>
                  )}
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
              {/* Order Summary */}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Total bill</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">EGP {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">VAT</span>
                  <span className="font-semibold text-gray-900 dark:text-white">EGP {vat.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-orange-500 dark:text-orange-400">EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading || !orderId}
                className={`w-full mt-8 py-4 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  paymentMethod === "online"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : paymentMethod === "online" ? (
                  "Pay Online"
                ) : (
                  "Pay at the cashier"
                )}
              </button>

              {/* Order Items Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">
                    <span className="font-medium">Order Items ({orderItems.length})</span>
                    <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div className="flex items-center">
                          <span className="text-gray-600 dark:text-gray-400">{item.quantity}x</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          EGP {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;