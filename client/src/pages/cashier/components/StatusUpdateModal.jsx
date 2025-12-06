// StatusUpdateModal.jsx - Update order status
import React, { useState } from "react";
import { X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "preparing", label: "Preparing", color: "bg-orange-100 text-orange-800" },
  { value: "ready", label: "Ready", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export default function StatusUpdateModal({
  order,
  onClose,
  onUpdate,
  loading = false,
}) {
  const [selectedStatus, setSelectedStatus] = useState(order?.status || "pending");

  const handleUpdate = () => {
    if (selectedStatus !== order?.status) {
      onUpdate(order._id, selectedStatus);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Update Order Status</h2>
          <button onClick={onClose} className="hover:bg-blue-800 p-2 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Order Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-slate-600 mb-1">Order ID</div>
            <div className="font-bold text-slate-900">
              #{order._id?.slice(-6).toUpperCase() || order._id?.toUpperCase()}
            </div>
            <div className="text-sm text-slate-600 mt-3 mb-1">Current Status</div>
            <div className="text-sm font-bold text-slate-900 capitalize">{order.status}</div>
          </div>

          {/* Status Selection */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 mb-3">Select New Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`p-3 rounded-lg font-bold transition-all ${
                    selectedStatus === status.value
                      ? `${status.color} ring-2 ring-offset-2 ring-blue-600 scale-105`
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="text-xs text-blue-600 font-bold mb-2">Customer</div>
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
            disabled={loading || selectedStatus === order?.status}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
