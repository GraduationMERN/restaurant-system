import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "../../redux/slices/ordersSlice";
import ActiveOrderComponent from "./ActiveOrderComponent";
import { ArrowLeft, Loader2, AlertCircle, Calendar, Clock, MapPin, CreditCard, Package, CheckCircle } from "lucide-react";
import { useToast } from "../../hooks/useToast";

/* -----------------------------------------
   CONSTANTS & HELPER FUNCTIONS
------------------------------------------*/
const STATUS_CONFIG = {
  completed: {
    label: "Delivered",
    color: "bg-emerald-500",
    icon: CheckCircle,
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-700 dark:text-emerald-300"
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-700 dark:text-red-300"
  },
  ready: {
    label: "Ready for Pickup",
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-700 dark:text-blue-300"
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-primary",
    bgColor: "bg-primary/10 dark:bg-primary/20",
    textColor: "text-primary dark:text-primary-300"
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    textColor: "text-amber-700 dark:text-amber-300"
  },
  preparing: {
    label: "Preparing",
    color: "bg-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    textColor: "text-purple-700 dark:text-purple-300"
  },
};

const PAYMENT_STATUS_CONFIG = {
  paid: {
    label: "Paid",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    textColor: "text-emerald-700 dark:text-emerald-300"
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    textColor: "text-emerald-700 dark:text-emerald-300"
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-300"
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300"
  }
};

/* -----------------------------------------
   REUSABLE COMPONENTS
------------------------------------------*/

// Loader
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 dark:border-primary/30 rounded-full"></div>
        <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
      </div>
      <p className="text-slate-600 dark:text-slate-300 font-medium">Loading order details...</p>
    </div>
  </div>
);

// Error Screen
const PageError = ({ message, onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-primary hover:text-primary/80 dark:text-primary-300 dark:hover:text-primary-200 font-medium mb-6 sm:mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Orders
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message || "The order doesn't exist or was deleted."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onBack}
                className="bg-primary hover:bg-primary/90 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-sm"
              >
                Go Back to Orders
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Status Badge
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${config.bgColor} ${config.textColor}`}>
      {Icon && <Icon className="w-4 h-4" />}
      <span>{config.label}</span>
    </div>
  );
};

// Info Card
const InfoCard = ({ children, className = "", title, icon: Icon }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary dark:text-primary-300" />}
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// Order Item Card
const OrderItemCard = ({ item, index }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg">
    <div className="flex items-start gap-4 flex-1">
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
        <span className="font-bold text-primary dark:text-primary-300">{index + 1}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 dark:text-white truncate">
          {item.name || item.productId?.name}
        </h4>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Qty: <span className="font-semibold">{item.quantity}</span>
          </span>
          {item.specialInstructions && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              • {item.specialInstructions}
            </span>
          )}
        </div>
      </div>
    </div>

    <div className="text-right ml-4">
      <p className="font-bold text-primary dark:text-primary-300">
        ${(item.totalPrice || item.price * item.quantity).toFixed(2)}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ${((item.totalPrice || item.price) / item.quantity).toFixed(2)} each
      </p>
    </div>
  </div>
);

// Summary Card
const SummaryCard = ({ order }) => (
  <InfoCard title="Order Summary" icon={Package}>
    <div className="space-y-3">
      <div className="flex justify-between items-center py-2">
        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
        <span className="font-semibold text-gray-900 dark:text-white">
          ${order.subtotal?.toFixed(2) || 0}
        </span>
      </div>
      
      {order.discount > 0 && (
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600 dark:text-gray-400">Discount</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            -${order.discount.toFixed(2)}
          </span>
        </div>
      )}
      
      {order.tax > 0 && (
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600 dark:text-gray-400">Tax</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${order.tax.toFixed(2)}
          </span>
        </div>
      )}
      
      {order.deliveryFee > 0 && (
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${order.deliveryFee.toFixed(2)}
          </span>
        </div>
      )}
      
      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg text-gray-900 dark:text-white">Total</span>
          <span className="font-bold text-2xl text-primary dark:text-primary-300">
            ${(order.totalAmount || order.total)?.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  </InfoCard>
);

// Payment Info Card
const PaymentInfoCard = ({ order }) => (
  <InfoCard title="Payment Information" icon={CreditCard}>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Method</span>
        <span className="font-semibold capitalize text-gray-900 dark:text-white">
          {order.paymentMethod || "N/A"}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Status</span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          PAYMENT_STATUS_CONFIG[order.paymentStatus]?.color || PAYMENT_STATUS_CONFIG.pending.color
        } ${
          PAYMENT_STATUS_CONFIG[order.paymentStatus]?.textColor || PAYMENT_STATUS_CONFIG.pending.textColor
        }`}>
          {order.paymentStatus || "Pending"}
        </span>
      </div>
    </div>
  </InfoCard>
);

// Delivery Info Card
const DeliveryInfoCard = ({ order }) => (
  <InfoCard title="Delivery Information" icon={MapPin}>
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Address</h4>
        <p className="text-gray-600 dark:text-gray-400">{order.deliveryAddress || "Not specified"}</p>
      </div>
      
      {order.estimatedDelivery && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Estimated delivery: {new Date(order.estimatedDelivery).toLocaleString()}</span>
        </div>
      )}
    </div>
  </InfoCard>
);

/* -----------------------------------------
   MAIN PAGE
------------------------------------------*/

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const isGuest = !user || user.isGuest;

  const { selectedOrder: order, selectedOrderLoading: loading, selectedOrderError: error } = useSelector((state) => state.orders);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  if (loading) return <PageLoader />;
  if (error || !order)
    return <PageError message={error} onBack={() => navigate("/orders")} />;

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/orders")}
                className="flex items-center gap-2 text-primary hover:text-primary/80 dark:text-primary-300 dark:hover:text-primary-200 font-medium transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="hidden sm:inline">Back to Orders</span>
              </button>
              
              <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
            
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:hidden mb-6">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 dark:text-primary-300 dark:hover:text-primary-200 font-medium transition-colors group sm:hidden"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back to Orders
          </button>
        </div>

        {/* Active Order Component */}
        {["pending", "confirmed", "preparing", "ready"].includes(order.status) && (
          <div className="mb-6 lg:mb-8">
            <ActiveOrderComponent order={order} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2">
            {/* Order Items */}
            <InfoCard title="Order Items" className="mb-6 lg:mb-8">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <OrderItemCard key={index} item={item} index={index} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No items found
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Delivery & Payment Info - Mobile Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
              <PaymentInfoCard order={order} />
              {order.deliveryAddress && (
                <DeliveryInfoCard order={order} />
              )}
            </div>
          </div>

          {/* Right Column - Summary & Info */}
          <div className="space-y-6 lg:space-y-8">
            <SummaryCard order={order} />
            
            {/* Payment & Delivery Info - Desktop Layout */}
            <div className="hidden lg:block space-y-6">
              <PaymentInfoCard order={order} />
              {order.deliveryAddress && (
                <DeliveryInfoCard order={order} />
              )}
            </div>

            {/* Additional Notes */}
            {order.notes && (
              <InfoCard title="Additional Notes">
                <p className="text-gray-600 dark:text-gray-400 italic">{order.notes}</p>
              </InfoCard>
            )}
          </div>
        </div>

        {/* Customer Support CTA */}
        <div className="mt-8 lg:mt-12">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Need help with your order?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our support team is here to assist you 24/7
                </p>
              </div>
              <button className="bg-primary hover:bg-primary/90 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors whitespace-nowrap shadow-sm">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}