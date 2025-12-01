import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createStripeSession, payInStore } from "../redux/slices/paymentSlice";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Debug: Log the full structure
  console.log("Full location state:", location.state);
  console.log("Order object:", location.state?.order);
  console.log("Order data:", location.state?.order?.data);
  
  // Extract orderId from the nested structure
  // The structure is: location.state.order.data.id or location.state.order.data._id
  const orderData = location.state?.order?.data;
  const orderId = orderData?.id || orderData?._id || orderData?.orderId;
  
  // Also check if there's a direct orderId (though it's undefined in your case)
  const directOrderId = location.state?.orderId;
  
  console.log("Extracted orderId:", orderId);
  console.log("Direct orderId:", directOrderId);
  
  // Add safe destructuring with fallbacks
  const { products = [], totalPrice = 0 } = useSelector((state) => state.cart || {});
  
  // Add safe destructuring for payment state with fallbacks
  const paymentState = useSelector((state) => state.payment || {});
  const { 
    loading = false, 
    error = null, 
    successMessage = null, 
    stripeSession = null 
  } = paymentState;
  
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log("Checking for orderId:", orderId);
    
    if (orderId) {
      console.log("Order found! ID:", orderId);
      setIsChecking(false);
    } else {
      console.warn("No orderId found. Full location state:", location.state);
      
      // Try to extract more deeply
      const deepOrderId = location.state?.order?.data?.id || 
                          location.state?.order?.data?._id ||
                          location.state?.order?.id;
      
      if (deepOrderId) {
        console.log("Found orderId deeply:", deepOrderId);
        setIsChecking(false);
        // We could set a state to use this, but for now we'll let the component handle it
      } else {
        console.error("No order ID found at all. Redirecting to checkout.");
        alert("No order found. Please complete checkout first.");
        navigate("/checkout");
      }
    }

    // Redirect to Stripe if session URL is available
    if (stripeSession?.url) {
      window.location.href = stripeSession.url;
    }
  }, [stripeSession, orderId, navigate, location.state]);

//   const handlePayment = async () => {
//     if (!orderId) {
//       alert("Order not found. Please complete checkout first.");
//       navigate("/checkout");
//       return;
//     }

//     try {
//       if (paymentMethod === "online") {
//         await dispatch(createStripeSession({ orderId })).unwrap();
//       } else {
//         await dispatch(payInStore({ orderId })).unwrap();
//         alert("Order confirmed for in-store payment!");
//         navigate("/");
//       }
//     } catch (err) {
//       console.error("Payment failed:", err);
//       alert(err.message || "Payment failed. Please try again.");
//     }
//   };
const handlePayment = async () => {
  if (!orderId) {
    alert("Order not found. Please complete checkout first.");
    navigate("/checkout");
    return;
  }

  console.log("Attempting payment with orderId:", orderId);
  console.log("Payment method:", paymentMethod);

  try {
    if (paymentMethod === "online") {
      console.log("Calling createStripeSession with orderId:", orderId);
      const result = await dispatch(createStripeSession({ orderId })).unwrap();
      console.log("Stripe session result:", result);
    } else {
      console.log("Calling payInStore with orderId:", orderId);
      const result = await dispatch(payInStore({ orderId })).unwrap();
      console.log("Pay in store result:", result);
      alert("Order confirmed for in-store payment!");
      navigate("/");
    }
  } catch (err) {
    console.error("Payment failed:", err);
    console.error("Error details:", err.message, err.stack);
    alert(err.message || "Payment failed. Please try again.");
  }
};
  // Show loading/checking state
  if (isChecking) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Complete Payment</h1>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Order ID Display */}
      {orderId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="font-medium text-blue-800">
            Order Reference: <span className="font-bold">{orderId}</span>
          </p>
          {orderData?.totalAmount && (
            <p className="font-medium text-blue-800 mt-1">
              Order Total: <span className="font-bold">EGP {orderData.totalAmount}</span>
            </p>
          )}
        </div>
      )}

      <div className="border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No items in order</p>
        ) : (
          <ul>
            {products.map((item) => (
              <li key={item.productId} className="flex justify-between mb-2 py-2 border-b">
                <span className="font-medium">{item.name} × {item.quantity}</span>
                <span className="font-medium">EGP {item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between font-bold mt-4 pt-4 border-t">
          <span className="text-lg">Total Amount:</span>
          <span className="text-lg">EGP {totalPrice}</span>
        </div>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Select Payment Method</h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === "online"}
              onChange={() => setPaymentMethod("online")}
              className="h-5 w-5"
            />
            <div>
              <span className="font-medium">Online Payment</span>
              <p className="text-sm text-gray-500">Pay securely with credit/debit card</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="instore"
              checked={paymentMethod === "instore"}
              onChange={() => setPaymentMethod("instore")}
              className="h-5 w-5"
            />
            <div>
              <span className="font-medium">Pay at Cashier</span>
              <p className="text-sm text-gray-500">Pay when you pick up your order</p>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading || !orderId}
        className={`${
          paymentMethod === "online" 
            ? "bg-blue-600 hover:bg-blue-700" 
            : "bg-green-600 hover:bg-green-700"
        } text-white py-3 px-4 rounded-lg w-full disabled:opacity-50 font-medium transition-colors`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Processing...
          </span>
        ) : paymentMethod === "online" ? (
          "Pay Online with Stripe"
        ) : (
          "Confirm Pay at Cashier"
        )}
      </button>

      {/* Back button */}
      <button
        onClick={() => navigate("/checkout")}
        className="mt-4 text-gray-600 hover:text-gray-800 font-medium"
      >
        ← Back to Checkout
      </button>
    </div>
  );
};

export default PaymentPage;