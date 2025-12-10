import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchOrderById } from "../../redux/slices/ordersSlice";
import ActiveOrderComponent from "./ActiveOrderComponent";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "../../hooks/useToast";

/* -----------------------------------------
   STATUS COLOR HELPER
------------------------------------------*/
const STATUS_STYLES = {
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  ready: "bg-blue-500",
  confirmed: "bg-primary",
  pending: "bg-primary",
  preparing: "bg-primary",
};

/* -----------------------------------------
   REUSABLE COMPONENTS
------------------------------------------*/

// Loader
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-slate-600 font-medium">Loading order details...</p>
    </div>
  </div>
);

// Error Screen
const PageError = ({ message, onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-primary hover:text-primary-900 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-red-500" />

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Order Not Found
            </h2>
            <p className="text-slate-600 mb-6">
              {message || "The order doesn't exist or was deleted."}
            </p>

            <button
              onClick={onBack}
              className="bg-primary text-white font-medium py-2 px-6 rounded-lg hover:bg-primary/80 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Back Button
const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-6 transition-colors"
  >
    <ArrowLeft className="w-4 h-4" />
    Back to Orders
  </button>
);

// Order Header
const OrderHeader = ({ order }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Order #{order._id.slice(-6).toUpperCase()}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Placed on{" "}
          {new Date(order.createdAt).toLocaleDateString()} at{" "}
          {new Date(order.createdAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Status Badge */}
      <span
        className={`px-4 py-2 rounded-full font-semibold text-white text-sm capitalize ${
          STATUS_STYLES[order.status] || "bg-primary"
        }`}
      >
        {order.status}
      </span>
    </div>
  </div>
);

// Order Items
const OrderItems = ({ items }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
    <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
      <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
    </div>

    <div className="divide-y">
      {items && items.length > 0 ? (
        items.map((item, i) => (
          <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 mb-1">
                  {item.name || item.productId?.name}
                </h3>
                <p className="text-sm text-slate-500">
                  Quantity: <span className="font-semibold">{item.quantity}</span>
                </p>
                {item.specialInstructions && (
                  <p className="text-sm text-slate-600 mt-2 italic">
                    Note: {item.specialInstructions}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-bold text-primary">
                  ${(item.totalPrice || item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  ${((item.totalPrice || item.price) / item.quantity).toFixed(2)} each
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="p-6 text-center text-slate-500">No items</div>
      )}
    </div>
  </div>
);

// Summary Row
const SummaryRow = ({ label, value, isTotal }) => (
  <div
    className={`flex justify-between items-center py-3 ${
      isTotal ? "bg-primary/10 px-4 rounded-lg mt-4" : "border-b border-slate-200"
    }`}
  >
    <span className={`text-slate-600 ${isTotal ? "font-bold" : ""}`}>
      {label}
    </span>
    <span
      className={`font-semibold ${
        isTotal ? "text-2xl text-primary" : "text-slate-900"
      }`}
    >
      ${value.toFixed(2)}
    </span>
  </div>
);

// Payment Info
const PaymentInfo = ({ order }) => (
  <div className="mt-6 pt-6 border-t border-slate-200">
    <h3 className="font-bold text-slate-900 mb-3">Payment Information</h3>

    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-slate-600">Method</span>
        <span className="font-semibold capitalize">{order.paymentMethod || "N/A"}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-slate-600">Status</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            order.paymentStatus === "paid" ||
            order.paymentStatus === "completed"
              ? "bg-green-100 text-green-700"
              : order.paymentStatus === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {order.paymentStatus || "Pending"}
        </span>
      </div>
    </div>
  </div>
);

// Delivery Address
const DeliveryAddress = ({ address }) => (
  <div className="mt-6 pt-6 border-t border-slate-200">
    <h3 className="font-bold text-slate-900 mb-3">Delivery Address</h3>
    <p className="text-slate-600">{address}</p>
  </div>
);

/* -----------------------------------------
   MAIN PAGE
------------------------------------------*/

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Single Order
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const result = await dispatch(fetchOrderById(id)).unwrap();
        setOrder(result);
      } catch (err) {
        setError("Failed to load the order");
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadOrder();
  }, [id, dispatch, toast]);

  if (loading) return <PageLoader />;
  if (error || !order)
    return <PageError message={error} onBack={() => navigate("/orders")} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <BackButton onClick={() => navigate("/orders")} />

        <OrderHeader order={order} />

        {["pending", "confirmed", "preparing", "ready"].includes(order.status) && (
          <ActiveOrderComponent order={order} />
        )}

        <OrderItems items={order.items} />

        {/* SUMMARY */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <SummaryRow label="Subtotal" value={order.subtotal || 0} />
          {order.discount > 0 && (
            <SummaryRow label="Discount" value={-order.discount} />
          )}
          {order.tax > 0 && <SummaryRow label="Tax" value={order.tax} />}
          {order.deliveryFee > 0 && (
            <SummaryRow label="Delivery Fee" value={order.deliveryFee} />
          )}
          <SummaryRow label="Total" value={order.totalAmount || order.total} isTotal />
          <PaymentInfo order={order} />
          {order.deliveryAddress && (
            <DeliveryAddress address={order.deliveryAddress} />
          )}
        </div>
      </div>
    </div>
  );
}
