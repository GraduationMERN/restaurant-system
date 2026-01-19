import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import supadminApi from '../../services/supadminApi';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useSelector(state => state.auth);

  useEffect(() => {
    const token = auth?.user?.accessToken || (typeof window !== 'undefined' && window.localStorage.getItem('accessToken'));
    if (token) supadminApi.attach(token);
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await supadminApi.getDashboardStats();
        setStats(res.data || {});
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [auth]);

  const statsMock = {
    totalRestaurants: stats?.totalRestaurants || 0,
    activeRestaurants: stats?.activeRestaurants || 0,
    trialRestaurants: stats?.trialRestaurants || 0,
    totalBookingsToday: stats?.totalBookingsToday || 0,
    revenueToday: stats?.revenueToday || 0,
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">SupAdmin Dashboard</h1>

      {loading && <div className="p-4">Loading...</div>}
      {error && <div className="p-4 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Restaurants</div>
          <div className="text-2xl font-bold">{statsMock.totalRestaurants}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-bold">{statsMock.activeRestaurants}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Trial</div>
          <div className="text-2xl font-bold">{statsMock.trialRestaurants}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Bookings Today</div>
          <div className="text-2xl font-bold">{statsMock.totalBookingsToday}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="col-span-2 bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Recent Activity</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="py-2">Time</th>
                <th className="py-2">Action</th>
                <th className="py-2">User</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent?.length ? (
                stats.recent.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-2">{r.action}</td>
                    <td className="py-2">{r.userEmail || r.user || 'system'}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr>
                    <td className="py-2">10:12</td>
                    <td className="py-2">Created restaurant Test Restaurant 1</td>
                    <td className="py-2">admin@platform.com</td>
                  </tr>
                  <tr>
                    <td className="py-2">09:47</td>
                    <td className="py-2">Suspended restaurant Old Place</td>
                    <td className="py-2">admin@platform.com</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </section>

        <aside className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => window.location.href = '/supadmin/restaurants/new'} className="px-3 py-2 bg-indigo-600 text-white rounded">Add New Restaurant</button>
            <button className="px-3 py-2 bg-gray-100 rounded">View Reports</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
