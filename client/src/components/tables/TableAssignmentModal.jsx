import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { AlertCircle, Check } from 'lucide-react';

export default function TableAssignmentModal({ booking, onClose, onAssign, restaurantId }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        // Get available tables (capacity >= guests and status = available)
        const res = await api.get(`/api/tables/by-capacity?restaurantId=${restaurantId}&minCapacity=${booking.guests}`);
        const list = res.data?.data ?? res.data ?? [];
        setTables(Array.isArray(list) ? list.filter(t => t.status === 'available') : []);
      } catch (err) {
        console.error('Failed to load available tables', err?.response?.data || err.message || err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restaurantId, booking.guests]);

  const handleAssign = async () => {
    if (!selectedTableId) return;
    try {
      await api.patch(`/api/bookings/${booking._id}`, { tableId: selectedTableId });
      onAssign && onAssign();
      onClose();
    } catch (err) {
      alert('Failed to assign table: ' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">{booking.customerName || 'Guest'} — Assign Table</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Booking for {booking.guests} guests on {booking.date} at {booking.startTime}
          </p>

          {loading ? (
            <div className="text-center text-gray-500 py-6">Loading available tables…</div>
          ) : tables.length === 0 ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">No available tables with enough capacity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {tables.map(table => (
                <button
                  key={table._id}
                  onClick={() => setSelectedTableId(table._id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTableId === table._id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                  }`}
                >
                  <div className="font-semibold">{table.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{table.capacity} seats</div>
                  {table.location && <div className="text-xs text-gray-500">{table.location}</div>}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:opacity-90">Cancel</button>
            <button onClick={handleAssign} disabled={!selectedTableId || loading} className="flex-1 px-4 py-2 rounded bg-primary-600 text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
