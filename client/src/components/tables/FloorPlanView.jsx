import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function FloorPlanView({ restaurantId }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/tables?restaurantId=${restaurantId}`);
        const list = res.data?.data ?? res.data ?? [];
        setTables(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load floor plan', err?.response?.data || err.message || err);
      } finally {
        setLoading(false);
      }
    };
    load();

    // subscribe to real-time updates if socket is available
    const handleTableUpdate = (updated) => {
      if (updated.restaurantId === restaurantId) {
        setTables(t => t.map(tbl => tbl._id === updated._id ? updated : tbl));
      }
    };

    if (window.__socket) {
      window.__socket.on('table:updated', handleTableUpdate);
      return () => window.__socket.off('table:updated', handleTableUpdate);
    }
  }, [restaurantId]);

  return (
    <div className="p-6">
      <h3 className="text-2xl font-bold mb-4">Floor Plan</h3>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading floor plan…</div>
      ) : (
        <div className="relative w-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-700" style={{ height: '600px', overflow: 'auto' }}>
          {tables.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <p>No tables in floor plan</p>
            </div>
          ) : (
            tables.map(table => (
              <div
                key={table._id}
                className={`absolute w-16 h-16 rounded-lg flex items-center justify-center shadow-md transition-colors ${
                  table.status === 'occupied'
                    ? 'bg-red-500 dark:bg-red-600'
                    : table.status === 'reserved'
                    ? 'bg-amber-500 dark:bg-amber-600'
                    : table.status === 'cleaning'
                    ? 'bg-gray-400 dark:bg-gray-600'
                    : 'bg-emerald-500 dark:bg-emerald-600'
                } text-white font-semibold text-center text-xs p-1`}
                style={{
                  left: `${table.positionX || 0}px`,
                  top: `${table.positionY || 0}px`,
                }}
                title={`${table.name} (${table.capacity} seats) - ${table.status}`}
              >
                <div className="w-full">
                  <div className="text-xs font-bold truncate">{table.name}</div>
                  <div className="text-xs opacity-90">{table.capacity}p</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
        <h4 className="font-semibold mb-2 text-sm">Table Status Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div> Available</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500"></div> Reserved</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div> Occupied</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-400"></div> Cleaning</div>
        </div>
      </div>
    </div>
  );
}
