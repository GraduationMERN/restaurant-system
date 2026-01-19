import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../context/SettingContext";
import FloorPlanEditor from "../../../components/tables/FloorPlanEditor";
import { Trash2, Layout } from "lucide-react";

export default function TablesAdmin() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const restaurantId = settings?.restaurantId || settings?._id || null;
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", capacity: 2, location: "" });
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  useEffect(() => { fetchTables(); }, [restaurantId]);

  const fetchTables = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/tables?restaurantId=${restaurantId}`);
      setTables(res.data?.data ?? res.data ?? []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const create = async () => {
    if (!restaurantId) return;
    try {
      await api.post("/api/tables", { ...form, restaurantId });
      setForm({ name: "", capacity: 2, location: "" });
      fetchTables();
    } catch (err) { console.error(err); }
  };

  const deleteTable = async (id) => {
    if (window.confirm('Delete this table?')) {
      try {
        await api.delete(`/api/tables/${id}`);
        fetchTables();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:opacity-90 mb-4">← Back</button>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your restaurant tables and edit the floor plan.</p>
        </div>
        <button onClick={() => setShowFloorPlan(!showFloorPlan)} className="px-4 py-2 rounded bg-primary-600 text-white hover:opacity-90 flex items-center gap-2">
          <Layout className="w-4 h-4" /> {showFloorPlan ? 'Hide' : 'Show'} Floor Plan
        </button>
      </div>

      {showFloorPlan && restaurantId ? (
        <FloorPlanEditor restaurantId={restaurantId} />
      ) : (
        <div className="space-y-6">
          {/* Create Table Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Create New Table</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input placeholder="Table Name (e.g., T1, A4)" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
              <input type="number" min={1} max={20} placeholder="Capacity" value={form.capacity} onChange={e => setForm(f=>({...f,capacity: Number(e.target.value)}))} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
              <input placeholder="Location (e.g., Window)" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
              <button onClick={create} disabled={!form.name || !restaurantId} className="px-4 py-2 rounded bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50">Create</button>
            </div>
          </div>

          {/* Tables List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Tables List</h2>
            {loading ? (
              <div className="text-center text-gray-500">Loading…</div>
            ) : tables.length === 0 ? (
              <div className="text-center text-gray-500">No tables yet. Create one above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b dark:border-gray-700">
                    <tr>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Capacity</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Position</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map(t => (
                      <tr key={t._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 font-semibold">{t.name}</td>
                        <td className="p-3">{t.capacity} guests</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{t.location || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            t.status === 'occupied' ? 'bg-red-100 text-red-700' :
                            t.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                            t.status === 'cleaning' ? 'bg-gray-100 text-gray-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {t.status || 'available'}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-600 dark:text-gray-400">({t.positionX || 0}, {t.positionY || 0})</td>
                        <td className="p-3 text-center">
                          <button onClick={() => deleteTable(t._id)} className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
