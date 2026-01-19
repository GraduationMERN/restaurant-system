import React, { useState } from "react";
import { X, AlertCircle, CheckCircle, Clock, Users, MapPin } from "lucide-react";

/**
 * Booking Modal - Used by customers to create bookings
 */
export const BookingModal = ({ isOpen, onClose, onSubmit, loading = false, initialData = {} }) => {
  const [form, setForm] = React.useState({
    date: initialData.date || "",
    startTime: initialData.startTime || "",
    guests: initialData.guests || 1,
    customerName: initialData.customerName || "",
    customerEmail: initialData.customerEmail || "",
    customerPhone: initialData.customerPhone || "",
    notes: initialData.notes || "",
  });

  // Update form when initialData changes and modal opens
  React.useEffect(() => {
    if (isOpen) {
      setForm({
        date: initialData.date || "",
        startTime: initialData.startTime || "",
        guests: initialData.guests || 1,
        customerName: initialData.customerName || "",
        customerEmail: initialData.customerEmail || "",
        customerPhone: initialData.customerPhone || "",
        notes: initialData.notes || "",
      });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "guests" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.startTime || !form.customerEmail || !form.customerName) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(form);
    setForm({
      date: "",
      startTime: "",
      guests: 1,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Book a Table</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Number of Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Guests *
            </label>
            <input
              type="number"
              name="guests"
              value={form.guests}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="customerEmail"
              value={form.customerEmail}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={form.customerPhone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Special Requests
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Window seat, high chair needed, etc."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Booking..." : "Book Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Booking Status Badge - Shows booking status with appropriate color
 */
export const BookingStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { bg: "bg-amber-100", text: "text-amber-800", label: "⏳ Pending" },
    confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "✅ Confirmed" },
    seated: { bg: "bg-green-100", text: "text-green-800", label: "🪑 Seated" },
    completed: { bg: "bg-gray-100", text: "text-gray-800", label: "✓ Completed" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "❌ Cancelled" },
    "no-show": { bg: "bg-red-100", text: "text-red-800", label: "⚠️ No-Show" },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

/**
 * Table Status Badge - Shows table status with appropriate color
 */
export const TableStatusBadge = ({ status }) => {
  const statusConfig = {
    available: { bg: "bg-green-100", text: "text-green-800", label: "✓ Available" },
    occupied: { bg: "bg-red-100", text: "text-red-800", label: "👥 Occupied" },
    reserved: { bg: "bg-blue-100", text: "text-blue-800", label: "🔒 Reserved" },
    cleaning: { bg: "bg-amber-100", text: "text-amber-800", label: "🧹 Cleaning" },
  };

  const config = statusConfig[status] || statusConfig.available;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

/**
 * Booking Card - Displays booking information
 */
export const BookingCard = ({
  booking,
  onConfirm,
  onReject,
  onSeated,
  onComplete,
  onCancel,
  showActions = false,
  actionLoading = false,
}) => {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {booking.customerName || "Guest"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{booking.bookingId}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Clock size={16} />
          <span>{booking.date} {booking.startTime}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Users size={16} />
          <span>{booking.guests} guests</span>
        </div>
        {booking.location && (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 col-span-2">
            <MapPin size={16} />
            <span>{booking.location}</span>
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="mb-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3 text-sm text-gray-600 dark:text-gray-400">
        <div>{booking.customerEmail}</div>
        {booking.customerPhone && <div>{booking.customerPhone}</div>}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          {booking.status === "pending" && (
            <>
              <button
                onClick={() => onConfirm?.(booking._id)}
                disabled={actionLoading}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => onReject?.(booking._id)}
                disabled={actionLoading}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {booking.status === "confirmed" && (
            <>
              <button
                onClick={() => onSeated?.(booking._id)}
                disabled={actionLoading}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded disabled:opacity-50"
              >
                Seated
              </button>
            </>
          )}
          {booking.status === "seated" && (
            <button
              onClick={() => onComplete?.(booking._id)}
              disabled={actionLoading}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded disabled:opacity-50"
            >
              Complete
            </button>
          )}
          {booking.status === "pending" || booking.status === "confirmed" ? (
            <button
              onClick={() => onCancel?.(booking._id)}
              disabled={actionLoading}
              className="flex-1 px-3 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 text-xs font-medium rounded disabled:opacity-50"
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

/**
 * Alert Component - For error and success messages
 */
export const Alert = ({ type = "info", title, message, onClose }) => {
  const typeConfig = {
    error: {
      icon: AlertCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      title: "text-red-900",
    },
    success: {
      icon: CheckCircle,
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      title: "text-green-900",
    },
    info: {
      icon: AlertCircle,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      title: "text-blue-900",
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={config.text} />
        <div className="flex-1">
          {title && <h4 className={`font-semibold ${config.title}`}>{title}</h4>}
          <p className={`text-sm ${config.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 hover:opacity-70 ${config.text}`}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
