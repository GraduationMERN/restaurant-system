// PaymentUpdateModal.jsx - Update payment status
import React, { useState } from "react";
import { X, DollarSign } from "lucide-react";

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
  { value: "refunded", label: "Refunded", color: "bg-blue-100 text-blue-800" },
];

export default function PaymentUpdateModal({
  order,
  onClose,
  onUpdate,
  loading = false,
}) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6" />
            <h2 className="text-xl font-bold">Update Payment Status</h2>
          </div>
          <button onClick={onClose} className="hover:bg-purple-800 p-2 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order & Payment Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-slate-600 mb-1">Order ID</div>
            <div className="font-bold text-slate-900 mb-4">
              #{order._id?.slice(-6).toUpperCase() || order._id?.toUpperCase()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-600 font-bold">Amount</div>
                <div className="text-lg font-bold text-amber-600">
                  ${(order.totalAmount || order.total || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 font-bold">Current Status</div>
                <div className="text-sm font-bold text-slate-900 capitalize">
                  {order.paymentStatus || "Pending"}
                </div>
              </div>
            </div>

            {order.paymentMethod && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-600 font-bold">Method</div>
                <div className="text-sm font-bold text-slate-900 capitalize">
                  {order.paymentMethod}
                </div>
              </div>
            )}
          </div>

          {/* Payment Status Selection */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 mb-3">Select Payment Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedPaymentStatus(status.value)}
                  className={`p-3 rounded-lg font-bold transition-all text-sm ${
                    selectedPaymentStatus === status.value
                      ? `${status.color} ring-2 ring-offset-2 ring-purple-600 scale-105`
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-xs text-purple-600 font-bold mb-2">Customer</div>
            <div className="font-bold text-slate-900">
              {order.customerName || "Walk-In Customer"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || selectedPaymentStatus === order?.paymentStatus}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? "Updating..." : "Update Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
