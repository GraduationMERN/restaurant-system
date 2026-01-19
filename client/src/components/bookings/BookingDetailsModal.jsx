import React, { useState, useEffect } from "react";
import Button from "../ui/button/Button";

export default function BookingDetailsModal({ booking, open, tables = [], onClose = () => {}, onUpdateStatus = () => {}, onSave = () => {} }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (booking) setForm({
      customerName: booking.customerName || "",
      startTime: booking.startTime || "",
      endTime: booking.endTime || "",
      guests: booking.guests || 1,
      tableId: booking.tableId?._id || booking.tableId || null,
      status: booking.status || "pending",
    });
  }, [booking]);

  if (!open || !booking) return null;

  const handleSave = async () => {
    try {
      await onSave(booking._id, form);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 p-4 rounded w-full max-w-md">
        <h3 className="text-lg font-semibold">Booking Details</h3>
        <div className="mt-2 space-y-2">
          <label className="block text-sm">Name
            <input className="w-full p-2 border rounded mt-1" value={form.customerName} onChange={(e) => setForm(f => ({...f, customerName: e.target.value}))} />
          </label>
          <div className="flex gap-2">
            <label className="flex-1 text-sm">Start
              <input className="w-full p-2 border rounded mt-1" value={form.startTime} onChange={(e) => setForm(f => ({...f, startTime: e.target.value}))} />
            </label>
            <label className="flex-1 text-sm">End
              <input className="w-full p-2 border rounded mt-1" value={form.endTime} onChange={(e) => setForm(f => ({...f, endTime: e.target.value}))} />
            </label>
          </div>
          <label className="block text-sm">Guests
            <input type="number" min={1} className="w-full p-2 border rounded mt-1" value={form.guests} onChange={(e) => setForm(f => ({...f, guests: Number(e.target.value)}))} />
          </label>
          <label className="block text-sm">Table
            <select className="w-full p-2 border rounded mt-1" value={form.tableId || ""} onChange={(e) => setForm(f => ({...f, tableId: e.target.value || null}))}>
              <option value="">Unassigned</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>{t.name || t._id} ({t.capacity})</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">Status
            <select className="w-full p-2 border rounded mt-1" value={form.status} onChange={(e) => setForm(f => ({...f, status: e.target.value}))}>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="seated">seated</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
