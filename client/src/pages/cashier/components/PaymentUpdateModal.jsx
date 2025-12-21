// PaymentUpdateModal.jsx - Update payment status
import React, { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

const getPaymentStatusOptions = (t) => [
  { value: "pending", label: t("admin.pending"), color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: t("paid"), color: "bg-green-100 text-green-800" },
  { value: "failed", label: t("failed"), color: "bg-red-100 text-red-800" },
  { value: "refunded", label: t("refunded"), color: "bg-blue-100 text-blue-800" },
];

export default function PaymentUpdateModal({
  order,
  onClose,
  onUpdate,
  loading = false,
}) {
  const { t } = useTranslation();
  const PAYMENT_STATUS_OPTIONS = getPaymentStatusOptions(t);

  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(
    order?.paymentStatus || "pending"
  );

  const handleUpdate = () => {
    if (selectedPaymentStatus !== order?.paymentStatus) {
      onUpdate(order._id, selectedPaymentStatus);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#7B4019]  text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6" />
            <h2 className="text-xl font-extrabold tracking-wide">{t("update_payment_status")}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#593114] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order & Payment Info */}
          <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-5 shadow-inner">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t("order_id")}</div>
            <div className="font-bold text-slate-900 dark:text-white text-lg mb-4">
              #{order._id?.slice(-6).toUpperCase() || order._id?.toUpperCase()}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t("amount")}</div>
                <div className="text-lg font-bold text-[#7B4019] mt-1">
                  {t("currency_symbol")}{(order.totalAmount || order.total || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t("current_status")}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white capitalize mt-1">
                  {order.paymentStatus || t("admin.pending")}
                </div>
              </div>
            </div>

            {order.paymentMethod && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t("method")}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white capitalize mt-1">
                  {order.paymentMethod}
                </div>
              </div>
            )}
          </div>

          {/* Payment Status Selection */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">{t("select_payment_status")}</h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedPaymentStatus(status.value)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                    selectedPaymentStatus === status.value
                      ? `${status.color} ring-2 ring-offset-2 ring-[#7B4019] scale-105`
                      : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-[#FFF1E5] dark:bg-gray-800 rounded-xl p-4 border border-[#7B4019]">
            <div className="text-xs text-[#7B4019] font-semibold mb-1">{t("customer")}</div>
            <div className="font-bold text-slate-900 dark:text-white">
              {order.customerInfo?.name || order.customerName || t("walk_in_customer")}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-gray-800 p-6 border-t border-slate-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-300 dark:bg-gray-600 hover:bg-slate-400 dark:hover:bg-gray-500 text-slate-900 dark:text-white font-bold py-3 rounded-xl transition-colors"
            disabled={loading}
          >
            {t("admin.cancel")}
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || selectedPaymentStatus === order?.paymentStatus}
            className="flex-1 bg-[#7B4019] hover:bg-[#593114] disabled:bg-slate-400 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? t("updating") : t("update_payment")}
          </button>
        </div>
      </div>
    </div>
  );
}
