import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import ComponentCard from '../../components/common/ComponentCard';
import TableAssignmentModal from '../../components/tables/TableAssignmentModal';
import FloorPlanView from '../../components/tables/FloorPlanView';
import { useSettings } from '../../context/SettingContext';
import { CheckCircle, Phone, X, Layout } from 'lucide-react';

export default function BookingsManager() {
  const { settings } = useSettings();
  const restaurantId = settings?.restaurantId || settings?._id || null;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/bookings/today?restaurantId=${restaurantId}`);
      const list = res.data?.data ?? res.data ?? [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load todays bookings', err?.response?.data || err.message || err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/bookings/${id}/status`, { status });
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Today's Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage reservations and table assignments.</p>
        </div>
        <button onClick={() => setShowFloorPlan(!showFloorPlan)} className="px-4 py-2 rounded bg-primary-600 text-white hover:opacity-90 flex items-center gap-2">
          <Layout className="w-4 h-4" /> {showFloorPlan ? 'Hide' : 'Show'} Floor
        </button>
      </div>

      {showFloorPlan && restaurantId ? (
        <FloorPlanView restaurantId={restaurantId} />
      ) : (
        <div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bookings for today</div>
          ) : (
            <div className="grid gap-3">
              {bookings.map(b => (
                <ComponentCard key={b._id} className="bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-bold text-lg">{b.customerName || 'Guest'}</div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          b.status === 'seated' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>📅 {b.date} • 🕐 {b.startTime} - {b.endTime}</div>
                        <div>👥 {b.guests} guests{b.customerPhone && ` • ☎️ ${b.customerPhone}`}</div>
                        <div>🏷️ {b.bookingId || b._id}</div>
                        {b.tableId && <div>🪑 Assigned to table</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.customerPhone && (
                        <a href={`tel:${b.customerPhone}`} title="Call" className="p-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => setSelectedBooking(b)} title="Assign table" className="p-2 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40">
                        <Layout className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateStatus(b._id, 'seated')} title="Mark seated" className="p-2 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateStatus(b._id, 'cancelled')} title="Cancel" className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </ComponentCard>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedBooking && (
        <TableAssignmentModal
          booking={selectedBooking}
          restaurantId={restaurantId}
          onAssign={() => { load(); }}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
