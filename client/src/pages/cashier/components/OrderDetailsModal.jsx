// OrderDetailsModal.jsx - Modern, responsive with dark mode support
import React from "react";
import { 
  X, Clock, MapPin, Phone, DollarSign, User, 
  ChefHat, Package, CreditCard, Tag, Truck, Receipt,
  Calendar, Hash, CheckCircle, AlertCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OrderDetailsModal({ order, onClose }) {
  const { t } = useTranslation();
  if (!order) return null;

  const createdTime = new Date(order.createdAt).getTime();
  const now = new Date().getTime();
  const prepTime = Math.floor((now - createdTime) / 1000 / 60);

  // Primary color definitions
  const PRIMARY = {
    light: "#8B5CF6", // Vibrant purple
    DEFAULT: "#7C3AED",
    dark: "#6D28D9",
    bg: "bg-purple-600",
    text: "text-purple-600",
    border: "border-purple-200"
  };

  const STATUS_CONFIG = {
    pending: { 
      label: t("admin.pending"), 
      bg: "bg-yellow-100 dark:bg-yellow-900/30", 
      text: "text-yellow-800 dark:text-yellow-300",
      icon: AlertCircle
    },
    confirmed: { 
      label: t("admin.confirmed"), 
      bg: "bg-blue-100 dark:bg-blue-900/30", 
      text: "text-blue-800 dark:text-blue-300",
      icon: CheckCircle
    },
    preparing: { 
      label: t("admin.preparing"), 
      bg: "bg-orange-100 dark:bg-orange-900/30", 
      text: "text-orange-800 dark:text-orange-300",
      icon: ChefHat
    },
    ready: { 
      label: t("admin.ready"), 
      bg: "bg-green-100 dark:bg-green-900/30", 
      text: "text-green-800 dark:text-green-300",
      icon: Package
    },
    completed: { 
      label: t("admin.completed"), 
      bg: "bg-emerald-100 dark:bg-emerald-900/30", 
      text: "text-emerald-800 dark:text-emerald-300",
      icon: CheckCircle
    },
    cancelled: { 
      label: t("admin.cancelled"), 
      bg: "bg-red-100 dark:bg-red-900/30", 
      text: "text-red-800 dark:text-red-300",
      icon: X
    }
  };

  const PAYMENT_CONFIG = {
    pending: { 
      label: t("admin.pending"), 
      bg: "bg-yellow-100 dark:bg-yellow-900/30", 
      text: "text-yellow-800 dark:text-yellow-300"
    },
    paid: { 
      label: t("paid"), 
      bg: "bg-green-100 dark:bg-green-900/30", 
      text: "text-green-800 dark:text-green-300"
    },
    completed: { 
      label: t("admin.completed"), 
      bg: "bg-green-100 dark:bg-green-900/30", 
      text: "text-green-800 dark:text-green-300"
    },
    failed: { 
      label: t("failed"), 
      bg: "bg-red-100 dark:bg-red-900/30", 
      text: "text-red-800 dark:text-red-300"
    },
    refunded: { 
      label: t("refunded"), 
      bg: "bg-blue-100 dark:bg-blue-900/30", 
      text: "text-blue-800 dark:text-blue-300"
    }
  };

  const currentStatus = order.status || "pending";
  const StatusIcon = STATUS_CONFIG[currentStatus]?.icon || AlertCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-200">
      {/* Modal Container */}
      <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        
        {/* Modal Content */}
        <div className="relative flex flex-col h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          {/* Header */}
          <div className="sticky top-0 z-10 p-6 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${PRIMARY.bg} bg-opacity-10 dark:bg-opacity-20`}>
                  <Receipt className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t("order")} #{order._id?.slice(-8).toUpperCase() || "N/A"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Status & Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("status_caps")}</span>
                    <StatusIcon className={`w-5 h-5 ${STATUS_CONFIG[currentStatus]?.text}`} />
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${STATUS_CONFIG[currentStatus]?.bg} ${STATUS_CONFIG[currentStatus]?.text} font-semibold text-sm`}>
                    {STATUS_CONFIG[currentStatus]?.label || order.status}
                  </div>
                </div>

                {/* Prep Time Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("prep_time_caps")}</span>
                    <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{prepTime}<span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{t("min_short")}</span></div>
                </div>

                {/* Items Count Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("items_caps")}</span>
                    <ChefHat className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{order.items?.length || 0}</div>
                </div>

                {/* Total Amount Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("total_caps")}</span>
                    <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {t("currency_symbol")}{(order.totalAmount || order.total || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Customer & Order Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-6">
                  {/* Customer Card */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{t("name")}</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {order.customerInfo?.name || order.customerName || t("walk_in_customer")}
                          </div>
                        </div>
                      </div>
                      {order.customerPhone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{t("phone")}</div>
                            <div className="font-medium text-gray-900 dark:text-white font-mono">
                              {order.customerPhone}
                            </div>
                          </div>
                        </div>
                      )}
                      {order.deliveryAddress?.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{t("delivery_address")}</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {order.deliveryAddress?.address}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t("method")}</div>
                        <div className="font-medium text-gray-900 dark:text-white capitalize">
                          {order.paymentMethod || t("not_specified")}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t("status")}</div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${PAYMENT_CONFIG[order.paymentStatus]?.bg || PAYMENT_CONFIG.pending.bg} ${PAYMENT_CONFIG[order.paymentStatus]?.text || PAYMENT_CONFIG.pending.text}`}>
                          {PAYMENT_CONFIG[order.paymentStatus]?.label || t("admin.pending")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("order_items")} ({order.items?.length || 0})</h3>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {order.items?.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <span className="font-bold text-purple-600 dark:text-purple-400">{item.quantity}x</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.name || item.productId?.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {t("currency_symbol")}{(item.price || 0).toFixed(2)} {t("each")}
                          </div>
                          {item.specialInstructions && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                              {t("note")}: {item.specialInstructions}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-600 dark:text-purple-400">
                            {t("currency_symbol")}{(item.totalPrice || item.price * item.quantity || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("order_summary")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">{t("subtotal")}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{t("currency_symbol")}{(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between py-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Tag className="w-4 h-4" />
                        <span>{t("discount")}</span>
                      </div>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">-{t("currency_symbol")}{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {order.tax > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">{t("tax")}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{t("currency_symbol")}{order.tax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between py-2">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Truck className="w-4 h-4" />
                        <span>{t("delivery_fee")}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{t("currency_symbol")}{order.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{t("total_amount")}</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {t("currency_symbol")}{(order.totalAmount || order.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("last_updated")}: {new Date(order.updatedAt || order.createdAt).toLocaleString()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("close")}
                </button>
              
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}