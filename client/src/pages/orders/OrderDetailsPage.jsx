// OrderDetailsPage.jsx - Individual Order Detail View
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "../../redux/slices/ordersSlice";
import ActiveOrderComponent from "./ActiveOrderComponent";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "../../hooks/useToast";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dispatch(fetchOrderById(id)).unwrap();
        setOrder(response);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err?.message || "Failed to load order details");
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id, dispatch, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Order Not Found
                </h2>
                <p className="text-slate-600 mb-6">
                  {error || "The order you're looking for doesn't exist or has been deleted."}
                </p>
                <button
                  onClick={() => navigate("/orders")}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Go Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Order #{order._id?.slice(-6).toUpperCase() || id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Status:</span>
              <span
                className={`px-4 py-2 rounded-full font-semibold text-white text-sm capitalize ${
                  order.status === "completed"
                    ? "bg-green-500"
                    : order.status === "cancelled"
                      ? "bg-red-500"
                      : order.status === "ready"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Active Order Component for Live Tracking */}
        {["pending", "confirmed", "preparing", "ready"].includes(order.status) && (
          <ActiveOrderComponent order={order} />
        )}

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
            <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
          </div>

          <div className="divide-y">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">
                        {item.name || item.productId?.name || "Unknown Item"}
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
                    <div className="text-right ml-4">
                      <p className="font-bold text-amber-600">
                        ${(item.totalPrice || item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        ${(item.totalPrice / item.quantity || item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                No items in this order
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">
                ${(order.subtotal || 0).toFixed(2)}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600">Discount</span>
                <span className="font-semibold text-green-600">
                  -${order.discount.toFixed(2)}
                </span>
              </div>
            )}

            {order.tax > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600">Tax</span>
                <span className="font-semibold text-slate-900">
                  ${order.tax.toFixed(2)}
                </span>
              </div>
            )}

            {order.deliveryFee > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600">Delivery Fee</span>
                <span className="font-semibold text-slate-900">
                  ${order.deliveryFee.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-amber-50 to-orange-50 px-4 rounded-lg">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-amber-600">
                ${(order.totalAmount || order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Payment Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Method</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {order.paymentMethod || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.paymentStatus === "completed" || order.paymentStatus === "paid"
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

          {/* Delivery Address (if applicable) */}
          {order.deliveryAddress && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">Delivery Address</h3>
              <p className="text-slate-600">{order.deliveryAddress}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
