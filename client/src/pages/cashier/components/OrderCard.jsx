// OrderCard.jsx - Reusable order card component
import React, { useState } from "react";
import {
  Clock,
  ChefHat,
  DollarSign,
  User,
  ChevronDown,
  Trash2,
  Edit2,
} from "lucide-react";

const STATUS_COLORS = {
  pending: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100" },
  confirmed: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100" },
  preparing: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100" },
  ready: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100" },
  completed: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100" },
  cancelled: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100" },
};

const PAYMENT_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800",
};

export default function OrderCard({
  order,
  onViewDetails,
  onUpdateStatus,
  onUpdatePayment,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const paymentColor = PAYMENT_STATUS_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-800";

  // Calculate prep time
  const createdTime = new Date(order.createdAt).getTime();
  const now = new Date().getTime();
  const prepTime = Math.floor((now - createdTime) / 1000 / 60); // minutes

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 mb-4 transition-all duration-200 hover:shadow-lg`}>
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-slate-900">
              Order #{order._id?.slice(-6).toUpperCase() || order._id?.toUpperCase()}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors.badge} ${colors.text}`}>
              {order.status.toUpperCase()}
            </span>
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-1 text-slate-600 text-sm mb-2">
            <User className="w-4 h-4" />
            <span>{order.customerName || "Walk-In Customer"}</span>
          </div>

          {/* Time & Items */}
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{prepTime} min ago</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span>{order.items?.length || 0} items</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span className="font-bold text-amber-600">
                ${(order.totalAmount || order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onUpdateStatus(order)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            title="Update Status"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(order._id)}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
            title="Delete Order"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`${colors.badge} ${colors.text} p-2 rounded-lg transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t-2 border-current opacity-30 pt-4 mt-4">
          {/* Items List */}
          <div className="mb-4">
            <h4 className="font-bold text-slate-900 mb-2">Items:</h4>
            <ul className="space-y-2">
              {order.items?.map((item, idx) => (
                <li key={idx} className="flex justify-between text-sm text-slate-700 bg-white bg-opacity-50 p-2 rounded">
                  <span>
                    {item.name || item.productId?.name} x {item.quantity}
                  </span>
                  <span className="font-bold">
                    ${(item.totalPrice || item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Payment:</span>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentColor}`}>
                  {order.paymentStatus || "pending"}
                </span>
                {order.paymentMethod && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                    {order.paymentMethod}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onViewDetails(order)}
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
            >
              Full Details
            </button>
            <button
              onClick={() => onUpdatePayment(order)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
