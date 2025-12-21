// src/pages/PaymentPage.jsx
import React, { useState, useEffect } from "react";
import socketClient from "../utils/socketRedux";
import { useToast } from "../hooks/useToast";
import { useSelector, useDispatch } from "react-redux";
import { createStripeSession, verifyPaymentStatus, clearPaymentState } from "../redux/slices/paymentSlice";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Store, CheckCircle, AlertCircle } from "lucide-react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { t } = useTranslation();
  
  // Get URL params for session ID (from payment-success page redirect)
  const { sessionId } = useParams();
  
  // Debug: Log the full location state to see what's being passed
  console.log("PaymentPage - location.state:", location.state);
  console.log("PaymentPage - sessionId from URL:", sessionId);
  
  // Get order from navigation state - handle both response structures
  const orderResponse = location.state?.order;
  const orderData = orderResponse?.data || orderResponse; // Try .data first, then the whole response
  const orderId = location.state?.orderId || orderData?.id || orderData?._id;
  
  console.log("PaymentPage - orderResponse:", orderResponse);
  console.log("PaymentPage - orderData:", orderData);
  console.log("PaymentPage - orderId:", orderId);
  
  // Get payment state
  const paymentState = useSelector((state) => state.payment || {});
  const { 
    loading = false, 
    error = null, 
    stripeSession = null,
    paymentStatus = null,
    verifiedOrder = null
  } = paymentState;
  
  // Get cart data as fallback
  const { products = [], totalPrice = 0 } = useSelector((state) => state.cart || {});
  
  // State
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [branchName, setBranchName] = useState("El Shatby Outlet");
  const [localError, setLocalError] = useState("");
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [showInstoreModal, setShowInstoreModal] = useState(false);

  // If sessionId exists in URL, we're coming from payment-success page
  useEffect(() => {
    if (sessionId && !orderId) {
      verifyPaymentBySession(sessionId);
    }
  }, [sessionId]);

  // Listen for payment updates specific to this user/order
  useEffect(() => {
    const s = socketClient.getSocket() || socketClient.initSocket();
    if (!s) return;

    const handleYourPayment = (order) => {
      const id = order?._id || order?.orderId;
      if (!id) return;
      if (id === orderId) {
        // If payment was marked paid, navigate to tracking or show toast
        if (order.paymentStatus === 'paid') {
          toast.showToast({ message: t("payment.verified_success"), type: 'success' });
          navigate(`/orders/${id}`, { state: { order } });
        } else {
          toast.showToast({ message: `Payment updated: ${order.paymentStatus}`, type: 'success' });
        }
      }
    };

    s.on('order:your-payment-updated', handleYourPayment);
    s.on('order:payment-updated', handleYourPayment);

    return () => {
      s.off('order:your-payment-updated', handleYourPayment);
      s.off('order:payment-updated', handleYourPayment);
    };
  }, [orderId, navigate, t]);

  // Handle stripe redirect
  useEffect(() => {
    if (stripeSession?.url) {
      console.log("Redirecting to Stripe:", stripeSession.url);
      window.location.href = stripeSession.url;
    }
  }, [stripeSession]);

  // Check for orderId on component mount
  useEffect(() => {
    if (!orderId && !sessionId) {
      console.error("No orderId found. Location state:", location.state);
      setLocalError(t("payment.verified_failed"));
      
      // Redirect after 3 seconds
      const timer = setTimeout(() => {
        navigate("/checkout");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [orderId, sessionId, navigate, t]);

  // Verify payment by session ID
  const verifyPaymentBySession = async (sessionId) => {
    try {
      setIsVerifyingPayment(true);
      const result = await dispatch(verifyPaymentStatus(sessionId)).unwrap();
      
      if (result.success && result.data) {
        // If payment is already paid, redirect to tracking
        if (result.data.paymentStatus === 'paid') {
          navigate(`/orders/${result.data._id}`, {
            state: { order: result.data }
          });
        } else {
          // Payment not completed yet, show payment options
          setLocalError(t("payment.verified_failed"));
        }
      }
    } catch (err) {
      console.error("Failed to verify payment:", err);
      setLocalError(t("payment.verified_failed"));
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!orderId) {
      setLocalError(t("payment.verified_failed"));
      return;
    }

    // Clear any previous errors
    dispatch(clearPaymentState());
    setLocalError("");

    try {
      // First, update the order with the correct payment method
      let updatePaymentMethod = "cash"; // Default to cash for in-store
      if (paymentMethod === "online") {
        updatePaymentMethod = "card";
      }
      
      console.log(`[PAYMENT] Updating order ${orderId} with payment method: ${updatePaymentMethod}`);
      
      // Update order payment method via API
      await api.patch(`/api/orders/${orderId}/payment-method`, {
        paymentMethod: updatePaymentMethod
      });

      console.log(`[PAYMENT] Order updated successfully with payment method: ${updatePaymentMethod}`);

      if (paymentMethod === "online") {
        const result = await dispatch(createStripeSession({ 
          orderId, 
          paymentMethod: "card" 
        })).unwrap();
        
        if (result.success) {
          console.log("Stripe session created:", result);
          // Redirection happens automatically via useEffect
        } else {
          setLocalError(result.message || t("payment.verified_failed"));
        }
      } else {
        // For in-store payments we should NOT mark the order as paid from the customer's client.
        // The cashier should confirm / mark payment at the POS. Simply navigate to tracking
        // so the customer can wait for the cashier confirmation.
        navigate(`/orders/${orderId}`, {
          state: {
            orderId,
            order: orderData,
          },
        });
      }
    } catch (err) {
      console.error("Payment failed:", err);
      
      // Check for 403 authorization errors
      if (err.message && err.message.includes("403")) {
        setLocalError("Oops! We encountered an authorization issue. This might be a temporary issue. Please try again or contact support.");
      } else if (err.message && err.message.includes("Not authorized")) {
        setLocalError("You are not authorized to pay for this order. Please check your order and try again.");
      } else {
        setLocalError(err.message || t("payment.verified_failed"));
      }
    }
  };

  // If there's an error with orderId, show error message
  if (localError && !orderId && !sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("payment.verified_failed")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{localError}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Redirecting to checkout in a few seconds...
          </p>
          <button
            onClick={() => navigate("/checkout")}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {t("payment.back")}
          </button>
        </div>
      </div> 
    );
  }

  // Use verified order data if available, otherwise use location state
  const displayOrder = verifiedOrder || orderData;
  const displayOrderId = verifiedOrder?._id || orderId;

  // Calculate totals - use order data if available, otherwise use cart
  const orderItems = displayOrder?.items || products;
  const subtotal = displayOrder?.subtotal || displayOrder?.totalAmount || totalPrice;
  const vat = displayOrder?.vat || 0;
  const total = displayOrder?.totalAmount || subtotal + vat;

  // If verifying payment, show loading
  if (isVerifyingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("payment.verifying")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary/90 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t("payment.back")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Order ID Display */}
        {/* {displayOrderId && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text- dark:text-blue-300 text-center font-medium">
              Order Reference: <span className="font-bold">{displayOrderId}</span>
              {displayOrder?.orderNumber && ` (${displayOrder.orderNumber})`}
            </p>
          </div>
        )} */}

        {/* Payment Status Display */}
        {paymentStatus && (
          <div className={`mb-6 p-4 rounded-xl ${
            paymentStatus === 'success' || paymentStatus === 'paid' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : paymentStatus === 'failed' 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            <p className={`text-center font-medium ${
              paymentStatus === 'success' || paymentStatus === 'paid'
                ? 'text-green-800 dark:text-green-300'
                : paymentStatus === 'failed'
                ? 'text-red-800 dark:text-red-300'
                : 'text-blue-800 dark:text-blue-300'
            }`}>
              {paymentStatus === 'paid' && `✅ ${t("payment.verified_success")}`}
              {paymentStatus === 'success' && `✅ ${t("payment.verified_success")}`}
              {paymentStatus === 'failed' && `❌ ${t("payment.verified_failed")}`}
              {paymentStatus === 'processing' && `⏳ ${t("payment.processing")}`}
              {paymentStatus === 'redirecting' && '↗️ Redirecting to payment gateway...'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Branch Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("payment.branch")}</h2>
              <div className="flex items-start">
                <div className="bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary-900 rounded-lg p-3 mr-4">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("payment.from_branch")}:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{branchName}</p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t("payment.payment_methods")}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Online Payment Option */}
                <button
                  onClick={() => setPaymentMethod("online")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === "online"
                      ? "border-primary dark:border-primary-dark bg-primary/10 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/90 dark:hover:border-primary-dark/90"
                  }`}
                  disabled={paymentStatus === 'paid' || paymentStatus === 'success'}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${
                      paymentMethod === "online"
                        ? "bg-primary dark:bg-primary-dark text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${
                        paymentMethod === "online"
                          ? "text-primary dark:text-primary-dark"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {t("payment.online")}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("payment.online_desc")}</p>
                    </div>
                    {paymentMethod === "online" && (
                      <div className="ml-auto">
                        <CheckCircle className="w-6 h-6 text-primary dark:text-primary-dark" />
                      </div>
                    )}
                  </div>
                </button>

                {/* In-store Payment Option */}
                <button
                  onClick={() => setShowInstoreModal(true)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === "instore"
                      ? "border-primary dark:border-primary-dark bg-primary/10 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/300 dark:hover:border-primary-dark/90"
                  }`}
                  disabled={paymentStatus === 'paid' || paymentStatus === 'success'}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${
                      paymentMethod === "instore"
                        ? "bg-primary dark:bg-primary-dark/90 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      <Store className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${
                        paymentMethod === "instore"
                          ? "text-primary dark:text-primary-dark/90"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {t("payment.instore")}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("payment.instore_desc")}</p>
                    </div>
                    {paymentMethod === "instore" && (
                      <div className="ml-auto">
                        <CheckCircle className="w-6 h-6 text-primary dark:text-primary-dark/90" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Notification Message */}
              <div className="mt-8 p-4 bg-primary/10 dark:bg-blue-900/20 border border-primary dark:border-blue-800 rounded-xl">
                <p className="text-black dark:text-blue-300 text-center">
                  {t("payment.notify_ready")}{" "}
                  {paymentMethod === "instore" && (
                    <span className="font-semibold">{t("payment.kindly_pay")}</span>
                  )}
                </p>
              </div>

              {/* Error Display */}
              {(error || localError) && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error || localError}</p>
                </div>
              )}

              {/* Already Paid Warning */}
              {(paymentStatus === 'paid' || paymentStatus === 'success') && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 text-sm text-center">
                    ✅ {t("payment.already_paid")}. {t("payment.thank_you")}
                  </p>
                  <button
                    onClick={() => navigate(`/orders/${displayOrderId}`)}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    {t("payment.track_order")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
              {/* Order Summary */}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t("payment.total_bill")}</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t("payment.subtotal")}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">EGP {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t("payment.vat")}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">EGP {vat.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{t("payment.total")}</span>
                  <span className="text-lg font-bold text-primary dark:text-primary-dark-900">EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading || !displayOrderId || paymentStatus === 'paid' || paymentStatus === 'success'}
                className={`w-full mt-8 py-4 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  paymentMethod === "instore"
                    ? "bg-emerald-500 hover:from-emerald-600 hover:to-emerald-700"
                    :  "bg-primary hover:bg-primary/90"
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("payment.processing")}
                  </span>
                ) : paymentMethod === "online" ? (
                  paymentStatus === 'paid' || paymentStatus === 'success' ? t("payment.already_paid") : t("payment.pay_online")
                ) : (
                  paymentStatus === 'paid' || paymentStatus === 'success' ? t("payment.already_paid") : t("payment.pay_at_cashier")
                )}
              </button>

              {/* Order Items Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-dark transition-colors font-medium">
                    <span className="font-medium">{t("payment.order_items_count", { count: orderItems.length })}</span>
                    <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div className="flex items-center">
                          <span className="text-gray-600 dark:text-gray-400">{item.quantity}x</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                            {item.name || item.productId?.name || `Item ${index + 1}`}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          EGP {((item.price || item.totalPrice / item.quantity) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* In-Store Payment Confirmation Modal */}
        {showInstoreModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-primary dark:bg-primary-dark text-white rounded-full p-4">
                  <Store className="w-8 h-8" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t("payment.modal_title")}
              </h3>

              {/* Message */}
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {t("payment.modal_desc")}
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setPaymentMethod("instore");
                    setShowInstoreModal(false);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  {t("payment.yes_pay_cashier")}
                </button>
                <button
                  onClick={() => setShowInstoreModal(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  {t("payment.cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;