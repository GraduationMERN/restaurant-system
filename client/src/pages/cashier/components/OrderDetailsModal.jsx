// OrderDetailsModal.jsx - View full order details
import React from "react";
import { X, Clock, MapPin, Phone, DollarSign, User, ChefHat } from "lucide-react";

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const createdTime = new Date(order.createdAt).getTime();
  const now = new Date().getTime();
  const prepTime = Math.floor((now - createdTime) / 1000 / 60);

  const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const PAYMENT_COLORS = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Order #{order._id?.slice(-6).toUpperCase() || order._id?.toUpperCase()}</h2>
            <p className="text-amber-100 text-sm mt-1">
              {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <button onClick={onClose} className="hover:bg-orange-700 p-2 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Time Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs text-slate-600 font-bold mb-1">STATUS</div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                {order.status}
              </span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs text-slate-600 font-bold mb-1">PREP TIME</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">{prepTime} min</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs text-slate-600 font-bold mb-1">ITEMS</div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-slate-900">{order.items?.length || 0}</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs text-slate-600 font-bold mb-1">TOTAL</div>
              <div className="font-bold text-amber-600 text-lg">
                ${(order.totalAmount || order.total || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Customer Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600">Name:</span>
                <span className="font-bold text-slate-900 ml-2">{order.customerName || "Walk-In Customer"}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="font-mono">{order.customerPhone}</span>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start bg-white p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{item.name || item.productId?.name}</div>
                    <div className="text-sm text-slate-600">Qty: {item.quantity}</div>
                    {item.specialInstructions && (
                      <div className="text-xs text-slate-500 italic mt-1">
                        Note: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                  <div className="text-right font-bold text-amber-600">
                    ${(item.totalPrice || item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Method:</span>
                <span className="font-bold text-slate-900 capitalize">{order.paymentMethod || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS.pending}`}>
                  {order.paymentStatus || "Pending"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-purple-300">
                <span className="font-bold text-slate-900">Total Amount:</span>
                <span className="font-bold text-lg text-amber-600">
                  ${(order.totalAmount || order.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-bold text-slate-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-bold text-slate-900">${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount:</span>
                  <span className="font-bold">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax:</span>
                  <span className="font-bold text-slate-900">${order.tax.toFixed(2)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Fee:</span>
                  <span className="font-bold text-slate-900">${order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-green-300 font-bold text-lg">
                <span>Total:</span>
                <span className="text-amber-600">${(order.totalAmount || order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
