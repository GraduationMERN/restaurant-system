import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import { Trash2, Edit3, Plus, Square, Check, RefreshCw } from "lucide-react";

export default function TablesPanel() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", capacity: 2, location: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await api.get("/api/restaurant");
        const d = r.data?.data || r.data || {};
        const rid = d.restaurantId || d._id || null;
        if (!mounted) return;
        setRestaurantId(rid);
        if (rid) fetchTables(rid);
      } catch (err) {
        console.warn('Failed to load restaurant for tables panel', err?.response?.data || err.message || err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const fetchTables = async (rid = restaurantId) => {
    if (!rid) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/tables?restaurantId=${rid}`);
      const list = res.data?.data ?? res.data ?? [];
      setTables(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch tables', err?.response?.data || err.message || err);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!restaurantId) {
      alert('Restaurant information is loading. Please try again.');
      return;
    }
    if (!form.name.trim()) {
      alert('Please enter a table name.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/tables', { ...form, restaurantId });
      setForm({ name: "", capacity: 2, location: "" });
      fetchTables();
    } catch (err) {
      alert('Failed to create table: ' + (err?.response?.data?.message || err.message || 'Unknown error'));
      console.error('Failed to create table', err?.response?.data || err.message || err);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/tables/${id}/status`, { status });
      fetchTables();
    } catch (err) {
      console.error('Failed to update table status', err?.response?.data || err.message || err);
    }
  };

  const deleteTable = async (id) => {
    try {
      await api.delete(`/api/tables/${id}`);
      fetchTables();
    } catch (err) {
      console.error('Failed to delete table', err?.response?.data || err.message || err);
    }
  };

  return (
    <ComponentCard className="bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-green-600 dark:text-green-400">Tables</p>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Manage Floor Plan & Tables</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create, update status, and remove tables quickly.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchTables()} title="Refresh" className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-sm hover:opacity-90">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => {}} variant="outline" size="sm">Floor Plan</Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <input placeholder="Table name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="input" />
          <input type="number" min={1} placeholder="Capacity" value={form.capacity} onChange={e => setForm(f=>({...f,capacity: Number(e.target.value)}))} className="input" />
          <input placeholder="Location (e.g., Window)" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} className="input" />
        </div>
        <div className="flex gap-2">
          <Button onClick={createTable} disabled={saving || !form.name} size="sm"><Plus className="w-4 h-4 mr-2" />Create Table</Button>
        </div>

        <div>
          {loading ? (
            <div>Loading tables…</div>
          ) : (
            <ul className="space-y-3">
              {tables.length === 0 && (
                <li className="p-3 rounded-lg border border-dashed text-sm text-gray-500">No tables yet</li>
              )}

              {tables.map(t => (
                <li key={t._id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">{t.name?.charAt(0)?.toUpperCase()}</div>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-white">{t.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Capacity: {t.capacity} • {t.location}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'occupied' ? 'bg-red-100 text-red-700' : t.status === 'reserved' ? 'bg-amber-100 text-amber-700' : t.status === 'unavailable' ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {t.status || 'available'}
                    </div>

                    <select value={t.status || 'available'} onChange={e => updateStatus(t._id, e.target.value)} className="input text-sm">
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="occupied">Occupied</option>
                      <option value="unavailable">Unavailable</option>
                    </select>

                    <button onClick={() => deleteTable(t._id)} title="Delete" className="p-2 rounded-md bg-red-50 text-red-600 hover:opacity-90">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ComponentCard>
  );
}
