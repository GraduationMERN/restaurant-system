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
import { useTranslation } from "react-i18next";

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

export default function OrderCard({order,onViewDetails, onUpdateStatus,onUpdatePayment, onDelete,}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const paymentColor = PAYMENT_STATUS_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-800";

  // Check if this is a reward order
  const isRewardOrder = order.type === 'reward';

  // Calculate prep time
  const createdTime = new Date(order.createdAt).getTime();
  const now = new Date().getTime();
  const prepTime = Math.floor((now - createdTime) / 1000 / 60); // minutes

  // Get customer name
  const customerName = order.user?.name || order.customerInfo?.name || t("walk_in_customer");

  // Get order number
  const orderNumber = isRewardOrder 
    ? order.orderNumber 
    : (order.orderNumber || order._id?.slice(-6).toUpperCase());

 return (
  <div
    className={`bg-white dark:bg-gray-800 border-2 ${colors.border} dark:border-gray-700 rounded-2xl p-5 mb-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}
  >
    {/* Header Row */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            {isRewardOrder ? `${t("reward")} ${orderNumber}` : `${t("order")} #${orderNumber}`}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${colors.badge} ${colors.text} uppercase`}
          >
            {t("admin." + order.status)}
          </span>
          {isRewardOrder && (
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700 uppercase">
              {t("reward")}
            </span>
          )}
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-1 text-slate-600 text-sm mb-2">
          <User className="w-4 h-4" />
          <span>{customerName}</span>
        </div>

        {/* Time & Items/Reward Info */}
        <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{prepTime} {t("min_ago")}</span>
          </div>
          {isRewardOrder ? (
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span>1 {t("item")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span>{order.items?.length || 0} {t("items")}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold text-amber-600">
              {isRewardOrder ? `${order.pointsUsed} ${t("pts")}` : `${t("currency_symbol")}${(order.totalAmount || order.total || 0).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2 ml-4 items-start">
        <button
          onClick={() => onUpdateStatus(order)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
          title={t("update_status")}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(order._id)}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
          title={t("delete_order")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`${colors.badge} ${colors.text} p-2 rounded-lg transition-transform transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Expanded Details */}
    {expanded && (
      <div className="border-t-2 border-slate-200 pt-4 mt-4 space-y-4">
        {isRewardOrder ? (
          /* Reward Order Details */
          <div>
            <h4 className="font-bold text-slate-900 mb-2 text-sm">{t("items")}</h4>
            <ul className="space-y-2">
              <li className="flex justify-between items-center text-sm text-slate-700 bg-purple-50 p-2 rounded-lg shadow-sm">
                <span>
                  {order.reward?.productId?.name || t("reward_item")} x 1
                </span>
                <span className="font-bold text-purple-700">
                  {order.pointsUsed} {t("pts")}
                </span>
              </li>
            </ul>
          </div>
        ) : (
          /* Regular Order Details */
          <>
            {/* Items List */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 text-sm">{t("items")}</h4>
              <ul className="space-y-2">
                {order.items?.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center text-sm text-slate-700 bg-slate-50 p-2 rounded-lg shadow-sm"
                  >
                    <span>
                      {item.name || item.productId?.name} x {item.quantity}
                    </span>
                    <span className="font-bold">
                      {t("currency_symbol")}{(item.totalPrice || item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-bold text-slate-700">{t("payment")}:</span>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${paymentColor} uppercase`}
                >
                  {t("admin." + (order.paymentStatus || "pending"))}
                </span>
                {order.paymentMethod && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                    {order.paymentMethod}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Quick Action Buttons */}

          {!isRewardOrder && (
             <div className="flex gap-2 flex-wrap mt-2">
            <button
              onClick={() => onViewDetails(order)}
              className="w-0.5 flex-1 bg-[#7B4019] hover:bg-[#593114]  text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform "
            >
              {t("full_details")}
            </button>
            <button
              onClick={() => onUpdatePayment(order)}
              className="flex-1 bg-[#7B4019] hover:bg-[#593114] text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform "
            >
              {t("payment")}
            </button>
          </div>
          )}
        </div>
    )}
    </div>
  );
}
