// OrderHistoryComponent.jsx - Past Orders List
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ShoppingBag, ChevronRight } from "lucide-react";

export default function OrderHistoryComponent({ orders }) {
  const navigate = useNavigate();
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  if (!orders || orders.length === 0) return null;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700";
      case "refunded":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white p-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">Order History</h2>
            <p className="text-sm opacity-90">{orders.length} order(s)</p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {orders.map((order) => (
          <div
            key={order._id}
            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* Order Header Row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {order.orderNumber}
                  </h3>
                  <span
                    className={`text-xs font-semibold capitalize px-3 py-1 rounded-full border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Date and Type */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(order.createdAt)}
                  </div>
                  <div className="flex items-center gap-1 capitalize">
                    <MapPin className="w-4 h-4" />
                    {order.serviceType === "dine-in" ? "Dine In" : order.serviceType}
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  EGP {order.totalAmount?.toFixed(2) || 0}
                </p>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
              </p>
              <span
                className={`text-xs font-semibold capitalize px-2 py-1 rounded border ${
                  order.paymentStatus === "paid"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>

            {/* Expandable Details */}
            {expandedOrderId === order._id && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {/* Items */}
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">
                    Items:
                  </p>
                  <div className="space-y-1">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span>EGP {item.totalPrice?.toFixed(2) || (item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                {order.customerInfo?.name && (
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Customer:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customerInfo.name}
                      {order.customerInfo.phone && ` • ${order.customerInfo.phone}`}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">
                      Notes:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() =>
                  setExpandedOrderId(
                    expandedOrderId === order._id ? null : order._id
                  )
                }
                className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold text-sm transition-colors"
              >
                {expandedOrderId === order._id ? "Hide" : "Show"} Details
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    expandedOrderId === order._id ? "rotate-90" : ""
                  }`}
                />
              </button>

              <button
                onClick={() => navigate(`/orders/${order._id}`)}
                className="ml-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                View Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
