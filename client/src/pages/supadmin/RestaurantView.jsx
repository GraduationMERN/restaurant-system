import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import supadminApi from '../../services/supadminApi';

export default function RestaurantView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState(null);
  const auth = useSelector(s => s.auth);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = auth?.user?.accessToken || (typeof window !== 'undefined' && window.localStorage.getItem('accessToken'));
        if (token) supadminApi.attach(token);
        const res = await supadminApi.getRestaurant(id);
        const r = res.data?.restaurant || res.data;
        setRestaurant(r);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, auth]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{restaurant?.restaurantName || restaurant?.name || 'Restaurant'}</h1>
        <div>
          <Link to={`/supadmin/restaurants/${id}/edit`} className="px-3 py-2 bg-indigo-600 text-white rounded">Edit</Link>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          <div><strong>Contact Email:</strong> {restaurant?.email || '—'}</div>
          <div><strong>Contact Phone:</strong> {restaurant?.phone || '—'}</div>
          <div><strong>Plan:</strong> {restaurant?.subscription?.plan || '—'}</div>
          <div><strong>Status:</strong> {restaurant?.status || '—'}</div>
          <div><strong>Created:</strong> {restaurant?.createdAt ? new Date(restaurant.createdAt).toLocaleString() : '—'}</div>
          <div><strong>Slug:</strong> {restaurant?.slug || '—'}</div>
        </div>
      </div>
    </div>
  );
}
