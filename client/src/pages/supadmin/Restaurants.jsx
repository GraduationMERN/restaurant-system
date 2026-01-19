import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import supadminApi from '../../services/supadminApi';

const placeholder = Array.from({ length: 8 }).map((_, i) => ({
  _id: `r-${i+1}`,
  name: `Restaurant ${i+1}`,
  contactEmail: `owner${i+1}@test.com`,
  subscription: { plan: i % 3 === 0 ? 'trial' : i % 3 === 1 ? 'basic' : 'premium' },
  status: i % 4 === 0 ? 'suspended' : 'active',
  createdAt: new Date().toISOString(),
}));

export default function Restaurants() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useSelector(state => state.auth);

  useEffect(() => {
    const token = auth?.user?.accessToken || (typeof window !== 'undefined' && window.localStorage.getItem('accessToken'));
    if (token) supadminApi.attach(token);
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await supadminApi.getRestaurants({ page: 1, limit: 20 });
        setRestaurants(res.data?.data || res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [auth]);

  // Ensure data is array (API returns {restaurants: [], total, page, limit})
  const dataArray = Array.isArray(restaurants) ? restaurants : (restaurants?.restaurants || placeholder);
  const data = dataArray.length ? dataArray : placeholder;

  const filtered = data.filter(r => {
    if (filter !== 'all' && r.status !== filter && r.subscription?.plan !== filter) return false;
    if (!query) return true;
    return (r.restaurantName || r.name || '').toLowerCase().includes(query.toLowerCase()) || (r.email || r.contactEmail || '').toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Restaurants</h1>
        <div>
          <a href="/supadmin/restaurants/new" className="px-3 py-2 bg-indigo-600 text-white rounded">Add New Restaurant</a>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or email" className="px-3 py-2 border rounded w-64" />
        <div className="flex gap-2">
          {['all','active','trial','suspended'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded ${filter===f? 'bg-indigo-600 text-white':'bg-gray-100'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        {loading && <div className="p-4">Loading...</div>}
        {error && <div className="p-4 text-red-600">{error}</div>}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="p-3">Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-3">{r.name || r.restaurantName || '—'}</td>
                <td className="p-3">{r.contactEmail || r.email || '—'}</td>
                <td className="p-3">{r.subscription?.plan || '—'}</td>
                <td className="p-3">{r.status || '—'}</td>
                <td className="p-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                <td className="p-3">
                  <a href={`/supadmin/restaurants/${r._id}`} className="text-indigo-600 mr-2">View</a>
                  <a href={`/supadmin/restaurants/${r._id}/edit`} className="text-gray-600 mr-2">Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-gray-100 rounded">Prev</button>
          <span>Page 1</span>
          <button className="px-3 py-1 bg-gray-100 rounded">Next</button>
        </div>
      </div>
    </div>
  );
}
