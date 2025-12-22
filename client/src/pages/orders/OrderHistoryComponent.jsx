// OrderHistoryComponent.jsx - Past Orders List
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ShoppingBag, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OrderHistoryComponent({ orders }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  if (!orders || orders.length === 0) return null;

  // Format Date
  const formatDate = (date) =>
    new Date(date).toLocaleDateString(t("locale") || "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Unified Status Colors
  const statusStyles = {
    completed:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700",
    cancelled:
      "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700",
    refunded:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700",
    default:
      "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  };

  const paymentStyles = {
    paid:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
    pending:
      "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary text-white p-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">{t("orders.history.title")}</h2>
            <p className="text-sm opacity-90">{orders.length} {t("orders.history.count_suffix")}</p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order._id;
          const statusClass = statusStyles[order.status] || statusStyles.default;
          const paymentClass =
            paymentStyles[order.paymentStatus] || paymentStyles.pending;

          return (
            <div
              key={order._id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {/* Header + Status */}
              <div className="mb-4">
                <div className="flex-1 justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </h3>
                    <span
                      className={`text-xs font-semibold capitalize px-3 py-1 rounded-full border ${statusClass}`}
                    >
                      {t(`orders.status_steps.${order.status}`) || order.status}
                    </span>
                  </div>

                  {/* Date + Service Type */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.createdAt)}
                    </div>

                    <div className="flex items-center gap-1 capitalize">
                      <MapPin className="w-4 h-4" />
                      {order.serviceType === "dine-in"
                        ? t("orders.history.dine_in")
                        : order.serviceType}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  EGP {(order.totalAmount || 0).toFixed(2)}
                </p>
              </div>

              {/* Items + Payment Status */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.items?.length || 0} item
                  {order.items?.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Items */}
                  <div>
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {t("orders.history.items_label")}
                    </p>
                    <div className="space-y-1">
                      {order.items?.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                        >
                          <span>
                            {item.name} ×{item.quantity}
                          </span>
                          <span>
                            EGP{" "}
                            {(
                              item.totalPrice ||
                              item.price * item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer */}
                  {order.customerInfo?.name && (
                    <div>
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {t("orders.history.customer_label")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.customerInfo.name}
                        {order.customerInfo.phone &&
                          ` • ${order.customerInfo.phone}`}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div>
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {t("orders.history.notes_label")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() =>
                    setExpandedOrderId(isExpanded ? null : order._id)
                  }
                  className="flex items-center gap-2 text-primary font-semibold text-sm hover:text-primary/90 transition-colors"
                >
                  {isExpanded ? t("orders.history.hide_details") : t("orders.history.show_details")}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                <button
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="ml-auto px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  {t("orders.history.view_order")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
