import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { GripHorizontal, Save, RotateCcw } from 'lucide-react';

export default function FloorPlanEditor({ restaurantId }) {
  const [tables, setTables] = useState([]);
  const [draggedTable, setDraggedTable] = useState(null);
  const [canvas, setCanvas] = useState({ width: 1000, height: 600 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gridSnap, setGridSnap] = useState(20); // px snap grid

  useEffect(() => {
    const load = async () => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/tables?restaurantId=${restaurantId}`);
        const list = res.data?.data ?? res.data ?? [];
        setTables(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load tables', err?.response?.data || err.message || err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restaurantId]);

  const handleMouseDown = (e, table) => {
    e.preventDefault();
    setDraggedTable({ table, startX: e.clientX, startY: e.clientY, offsetX: table.positionX || 0, offsetY: table.positionY || 0 });
  };

  const handleMouseMove = (e) => {
    if (!draggedTable) return;
    const deltaX = e.clientX - draggedTable.startX;
    const deltaY = e.clientY - draggedTable.startY;
    const newX = Math.round((draggedTable.offsetX + deltaX) / gridSnap) * gridSnap;
    const newY = Math.round((draggedTable.offsetY + deltaY) / gridSnap) * gridSnap;
    
    setTables(t => t.map(tbl => tbl._id === draggedTable.table._id ? { ...tbl, positionX: newX, positionY: newY } : tbl));
  };

  const handleMouseUp = () => setDraggedTable(null);

  const savePositions = async () => {
    setSaving(true);
    try {
      for (const table of tables) {
        await api.put(`/api/tables/${table._id}`, { positionX: table.positionX || 0, positionY: table.positionY || 0 });
      }
      alert('Floor plan saved successfully!');
    } catch (err) {
      console.error('Failed to save positions', err?.response?.data || err.message || err);
      alert('Failed to save floor plan');
    } finally {
      setSaving(false);
    }
  };

  const resetPositions = () => {
    if (window.confirm('Reset all positions?')) {
      setTables(t => t.map(tbl => ({ ...tbl, positionX: Math.random() * 500, positionY: Math.random() * 400 })));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">Floor Plan Editor</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Drag tables to arrange your floor plan. Grid snap: {gridSnap}px</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetPositions} disabled={saving} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:opacity-90 flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={savePositions} disabled={saving} className="px-4 py-2 rounded bg-primary-600 text-white hover:opacity-90 flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="range" min={10} max={50} value={gridSnap} onChange={e => setGridSnap(Number(e.target.value))} />
          Grid Snap: {gridSnap}px
        </label>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading tables…</div>
      ) : (
        <div
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative w-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 border-2 border-dashed border-gray-400 dark:border-gray-600"
          style={{ height: `${canvas.height}px`, width: `${canvas.width}px`, overflow: 'hidden' }}
        >
          {tables.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <p>No tables. Create one first.</p>
            </div>
          ) : (
            tables.map(table => (
              <div
                key={table._id}
                onMouseDown={e => handleMouseDown(e, table)}
                className={`absolute w-16 h-16 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-colors ${
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
                  userSelect: 'none',
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
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500"></div> Available</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500"></div> Reserved</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500"></div> Occupied</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-400"></div> Cleaning</div>
        </div>
      </div>
    </div>
  );
}
