import React from "react";
import { CheckCircle, Calendar, Clock, Users } from "lucide-react";

export default function BookingConfirmation({ booking, onClose }) {
  const id = booking?._id || booking?.id || booking?.bookingId || null;
  const date = booking?.date || booking?.startDate || null;
  const startTime = booking?.startTime || booking?.time || null;
  const guests = booking?.guests || booking?.partySize || null;
  const status = booking?.status || "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reservation Confirmed</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your booking is {status}.</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            {id && (
              <div className="flex items-start gap-3">
                <span className="font-medium w-24">Reference</span>
                <span className="break-all">{id}</span>
              </div>
            )}
            {date && (
              <div className="flex items-start gap-3">
                <span className="font-medium w-24">Date</span>
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {date}</span>
              </div>
            )}
            {startTime && (
              <div className="flex items-start gap-3">
                <span className="font-medium w-24">Time</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {startTime}</span>
              </div>
            )}
            {guests != null && (
              <div className="flex items-start gap-3">
                <span className="font-medium w-24">Guests</span>
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {guests}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:opacity-90"
            >
              Close
            </button>
            <button
              onClick={() => { window.print(); }}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:opacity-90"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
