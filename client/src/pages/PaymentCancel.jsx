import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto p-6 text-center mt-20 bg-white shadow-lg rounded-xl">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Payment Canceled</h1>
      <p className="mb-4">Your payment was canceled. You can try again or pay at the store.</p>
      <div className="flex justify-center gap-4">
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          onClick={() => navigate(-1)}
        >
          Try Again
        </button>
        <button
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          onClick={() => navigate("/orders")}
        >
          Pay In-Store
        </button>
      </div>
    </div>
  );
}
