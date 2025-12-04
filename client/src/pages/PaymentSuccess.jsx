// src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle, Clock, Store, CreditCard, Star, Phone, Home, ArrowLeft } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  // Get order details from Redux or location state
  const { currentOrder } = useSelector((state) => state.order || {});
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch order details based on sessionId or get from state
    const fetchOrderDetails = async () => {
      try {
        // You would typically fetch order details from backend
        // For now, we'll simulate with currentOrder or mock data
        if (currentOrder) {
          setOrderDetails(currentOrder);
        } else {
          // Mock data for demonstration
          setOrderDetails({
            id: "114858",
            orderNumber: "ORD-114858",
            items: [
              { name: "Turkish Coffee Single Turkish S", quantity: 2, price: 80 }
            ],
            totalAmount: 160,
            subtotal: 160,
            vat: 0,
            paymentMethod: "card", // or "instore"
            serviceType: "pickup", // or "delivery", "dine-in"
            branch: "El Shatiy Outlet",
            estimatedTime: 25,
            estimatedReadyTime: new Date(Date.now() + 25 * 60000),
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, currentOrder, navigate]);

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

  const shouldShowCashierMessage = () => {
    return orderDetails?.paymentMethod === "instore" || 
           orderDetails?.serviceType === "pickup";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Wider on desktop */}
          <div className="lg:col-span-8 space-y-6">
            {/* Success Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-orange-500 dark:text-orange-400" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {orderDetails?.paymentMethod === "card" ? "Payment Successful!" : "Order Confirmed!"}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {orderDetails?.paymentMethod === "card" 
                  ? "Your payment has been processed successfully."
                  : "Your order has been confirmed and is being prepared."
                }
              </p>

              {/* Conditional Cashier Message */}
              {shouldShowCashierMessage() && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-300">Kindly pay at the cashier</span>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-400">From Branch: {orderDetails?.branch || "El Shatiy Outlet"}</p>
                </div>
              )}

              {/* Branch Info */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3">
                  <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="text-sm text-blue-600 dark:text-blue-400">From Branch:</p>
                    <p className="font-bold text-blue-800 dark:text-blue-300">{orderDetails?.branch || "El Shatiy Outlet"}</p>
                  </div>
                </div>
              </div>

              {/* Order Progress */}
              <div className="flex justify-between items-center mb-8 relative max-w-2xl mx-auto">
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
                <span className="text-xl font-bold text-gray-900 dark:text-white">{getEstimatedTime()}</span>
                <span className="text-gray-600 dark:text-gray-400">Estimated ready time</span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-8">
                We will notify you once your order is ready.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button 
                  onClick={() => window.location.href = `tel:${process.env.REACT_APP_RESTAURANT_PHONE || "+1234567890"}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-orange-500 dark:border-orange-400 text-orange-500 dark:text-orange-400 rounded-xl font-medium hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call the restaurant
                </button>
                
                <button 
                  onClick={() => {
                    const id = orderDetails?._id || orderDetails?.id || orderDetails?.orderNumber;
                    if (id) {
                      navigate("/orders", { state: { orderId: id, order: orderDetails } });
                    } else {
                      navigate("/orders");
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 dark:bg-orange-400 text-white rounded-xl font-medium hover:bg-orange-600 dark:hover:bg-orange-500 transition-colors"
                >
                  <Clock className="h-5 w-5" />
                  Track Order
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

            {/* Order Items Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {orderDetails?.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex items-center">
                      <span className="text-gray-600 dark:text-gray-400 mr-3">{item.quantity}x</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
              {/* Order Number */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Order Summary</h2>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <p className="text-sm text-orange-600 dark:text-orange-400">Order Number</p>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                    #{orderDetails?.orderNumber || orderDetails?.id || "114858"}
                  </p>
                </div>
              </div>

              {/* Payment Method Badge */}
              <div className="mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  orderDetails?.paymentMethod === "card" 
                    ? "bg-blue-100 dark:bg-blue-900/20" 
                    : "bg-orange-100 dark:bg-orange-900/20"
                }`}>
                  {orderDetails?.paymentMethod === "card" ? (
                    <>
                      <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Paid with Card</span>
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-orange-700 dark:text-orange-300 font-medium">Pay at Cashier</span>
                    </>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    EGP {orderDetails?.subtotal?.toFixed(2) || orderDetails?.totalAmount?.toFixed(2) || "160.00"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">VAT</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    EGP {orderDetails?.vat?.toFixed(2) || "0.00"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-orange-500 dark:text-orange-400">
                    EGP {orderDetails?.totalAmount?.toFixed(2) || "160.00"}
                  </span>
                </div>
              </div>

              {/* Estimated Time Display */}
              <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimated Ready Time</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{getEstimatedTime()}</p>
              </div>

              {/* Go to Menu Button */}
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 dark:bg-orange-400 text-white rounded-xl font-semibold hover:bg-orange-600 dark:hover:bg-orange-500 transition-colors"
              >
                <Home className="h-5 w-5" />
                Go to Menu
              </button>

              {/* Additional Information */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">What's Next?</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="h-5 w-5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs">
                      1
                    </span>
                    You'll receive an order confirmation
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs">
                      2
                    </span>
                    We'll notify you when ready
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs">
                      3
                    </span>
                    Rate your experience after
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Search Bar (optional) */}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Type here to search"
              className="w-full p-3 pl-12 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              🔍
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default PaymentSuccess;