import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { cancelOrder } from "../../redux/slices/ordersSlice";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  XCircle,
  ChefHat,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function ActiveOrderComponent({ order }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const [canceling, setCanceling] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Status progression
  const statusSteps = ["pending", "confirmed", "preparing", "ready", "completed"];
  const currentStep = statusSteps.indexOf(order?.status) || 0;
  const progressPercent = ((currentStep + 1) / statusSteps.length) * 100;

  // Status icons
  const statusIcons = {
    pending: <Clock className="w-5 h-5" />,
    confirmed: <CheckCircle2 className="w-5 h-5" />,
    preparing: <ChefHat className="w-5 h-5" />,
    ready: <Zap className="w-5 h-5" />,
    completed: <CheckCircle2 className="w-5 h-5" />,
  };

  // Status colors simplified with primary/secondary
  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    confirmed: "bg-primary/10 text-primary border-primary/30",
    preparing: "bg-secondary/10 text-secondary border-secondary/30",
    ready: "bg-green-100 text-green-700 border-green-300",
    completed: "bg-gray-200 text-gray-700 border-gray-400",
  };

  // Countdown Timer
  useEffect(() => {
    if (!order?.estimatedReadyTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const est = new Date(order.estimatedReadyTime).getTime();
      const diff = est - now;

      setCountdownSeconds(diff > 0 ? Math.ceil(diff / 1000) : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.estimatedReadyTime]);

  const formatCountdown = (s) =>
    s <= 0 ? t("orders.status_steps.ready") + "!" : `${Math.floor(s / 60)}m ${s % 60}s`;

  const handleCancel = async () => {
    if (!order?._id) return;

    try {
      setCanceling(true);
      await dispatch(cancelOrder(order._id)).unwrap();
      toast.showToast({ message: t("orders.toast.cancel_success"), type: "success" });
      setShowCancelConfirm(false);
    } catch (err) {
      toast.showToast({ message: err || t("orders.toast.cancel_fail"), type: "error" });
    } finally {
      setCanceling(false);
    }
  };

  if (!order) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">{t("orders.order_details.order_number")}</p>
            <h2 className="text-sm sm:text-3xl font-bold">{order.orderNumber}</h2>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm ${
              order.status === "ready" ? "animate-pulse" : ""
            }`}
          >
            {statusIcons[order.status.toLowerCase()] || statusIcons.pending}
            <span className="font-semibold capitalize">{t(`orders.status_steps.${order.status.toLowerCase()}`) || order.status}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">

        {/* ETA */}
        {order.estimatedReadyTime && (
          <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-primary mb-1">{t("orders.order_details.estimated_ready_time")}</p>
            <p className="text-2xl font-bold text-primary">
              {formatCountdown(countdownSeconds)}
            </p>
          </div>
        )}

        {/* Customer + Service */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> {t("orders.order_details.customer")}
            </h3>

            <div className="space-y-2">
              <p className="font-medium">{order.customerInfo?.name || t("orders.order_details.guest")}</p>

              {order.customerInfo?.phone && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {order.customerInfo.phone}
                </p>
              )}

              {order.customerInfo?.email && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {order.customerInfo.email}
                </p>
              )}
            </div>
          </div>

          {/* Service */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {t("orders.order_details.service_details")}
            </h3>

            <div className="space-y-2">
              <p className="font-medium capitalize">{order.serviceType}</p>

              {order.serviceType === "dine-in" && order.tableNumber && (
                <p className="text-gray-600 dark:text-gray-400">
                  {t("orders.order_details.table_prefix")}{order.tableNumber}
                </p>
              )}

              {order.serviceType === "delivery" && order.deliveryAddress?.address && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {order.deliveryAddress?.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-3">{t("orders.order_details.items")} ({order.items?.length})</h3>

          <div className="space-y-2">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500 text-xs">x{item.quantity}</p>
                </div>

                <p className="font-semibold">
                  EGP {(item.totalPrice || item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>{t("orders.order_details.subtotal")}</span>
            <span>EGP {order.subtotal?.toFixed(2)}</span>
          </div>

          {order.vat > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>{t("orders.order_details.vat")}</span>
              <span>EGP {order.vat?.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>{t("orders.order_details.total")}</span>
            <span>EGP {order.totalAmount?.toFixed(2)}</span>
          </div>

          {/* Payment status badge */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("orders.order_details.payment_status")}</span>

              <span
                className={`text-sm font-semibold capitalize px-3 py-1 rounded-full border ${
                  order.paymentStatus === "paid"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-yellow-100 text-yellow-700 border-yellow-300"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
         

          {order.status === "pending" && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="py-3 px-4 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              {t("orders.action.cancel")}
            </button>
          )}
          
          {order.status !== "pending" && (
            <div className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-center font-semibold">
              ✓ {t("orders.error.cannot_cancel", { status: order.status })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

            <h3 className="text-lg font-bold mb-2">
              {t("orders.modal.cancel_title")}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("orders.modal.cancel_confirm", { orderNumber: order.orderNumber })}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={canceling}
                className="flex-1 py-2 border rounded-xl font-semibold hover:bg-gray-50"
              >
                {t("orders.modal.keep_order")}
              </button>

              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl"
              >
                {canceling ? t("orders.modal.canceling") : t("orders.modal.yes_cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
