import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const sessionId = query.get("session_id");

  useEffect(() => {
    // Optionally: call backend to confirm payment using sessionId
  }, [sessionId]);

  return (
    <div className="max-w-xl mx-auto p-6 text-center mt-20 bg-white shadow-lg rounded-xl">
      <h1 className="text-3xl font-bold mb-4 text-green-600">Payment Successful!</h1>
      <p className="mb-4">Your order has been confirmed and will appear in your orders page.</p>
      <button
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
        onClick={() => navigate("/orders")}
      >
        Go to My Orders
      </button>
    </div>
  );
}
