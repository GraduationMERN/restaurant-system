import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import supadminApi from '../../services/supadminApi';

const defaultState = {
  name: '', contactEmail: '', contactPhone: '', contactName: '', address: '', subscriptionPlan: 'trial', slug: '', settings: { timezone: 'UTC', currency: 'USD', language: 'en' }
};

export default function RestaurantForm() {
  const [form, setForm] = useState(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const params = useParams();
  const auth = useSelector(state => state.auth);

  const onChange = (k, v) => setForm(s => ({ ...s, [k]: v }));
  
  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // basic validation
    if (!form.name || !form.contactEmail) {
      alert('Name and contact email required');
      return;
    }
    
    setLoading(true);
    try {
      const token = auth?.user?.accessToken || (typeof window !== 'undefined' && window.localStorage.getItem('accessToken'));
      console.log('Token available:', !!token);
      
      if (token) supadminApi.attach(token);

      const payload = {
        name: form.name,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contactName: form.contactName,
        address: form.address,
        subscription: { plan: form.subscriptionPlan },
        slug: form.slug,
        settings: form.settings,
      };

      console.log('Submitting payload:', payload);
      console.log('Is edit mode:', !!params.id);

      let res;
      if (params.id) {
        console.log('Calling updateRestaurant with id:', params.id);
        res = await supadminApi.updateRestaurant(params.id, payload);
        console.log('Update response:', res.data);
      } else {
        console.log('Calling createRestaurant');
        res = await supadminApi.createRestaurant(payload);
        console.log('Create response:', res.data);
      }
      
      setLoading(false);
      
      const body = res.data || {};
      console.log('Response body:', body);
      
      // For CREATE: response is {success, restaurantId, invitationToken, message}
      // For UPDATE: response is {restaurant: {...}}
      
      if (params.id) {
        // Update mode
        console.log('Update successful');
        alert('Restaurant updated successfully');
      } else {
        // Create mode
        const invitationToken = body.invitationToken;
        const restaurantId = body.restaurantId;
        
        console.log('Extracted restaurantId:', restaurantId);
        console.log('Extracted invitationToken:', invitationToken);
        
        if (invitationToken) {
          const message = `Restaurant created successfully!\n\nRestaurant ID: ${restaurantId}\n\nInvitation token:\n${invitationToken}\n\nCopy this token to share with the restaurant owner.\nThey can use it at: /invite/${invitationToken}`;
          console.log('Showing alert with token');
          alert(message);
        } else {
          alert('Restaurant created successfully');
        }
      }
      
      setTimeout(() => navigate('/supadmin/restaurants'), 500);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('Submit error:', err);
      console.error('Error message:', msg);
      console.error('Full error:', err);
      setError(msg);
      alert('Failed: ' + msg);
    }
  };

  useEffect(() => {
    const token = auth?.user?.accessToken || (typeof window !== 'undefined' && window.localStorage.getItem('accessToken'));
    if (token) {
      console.log('Attaching token to API');
      supadminApi.attach(token);
    } else {
      console.warn('No token available');
    }
  }, [auth]);

  // Load restaurant when editing
  useEffect(() => {
    const load = async () => {
      if (!params.id) return;
      setLoading(true);
      try {
        const token = auth?.user?.accessToken || (typeof window !== 'undefined' && window.localStorage.getItem('accessToken'));
        if (token) supadminApi.attach(token);
        
        console.log('Loading restaurant:', params.id);
        const res = await supadminApi.getRestaurant(params.id);
        console.log('Loaded restaurant:', res.data);
        
        const r = res.data?.restaurant || res.data;
        if (r) {
          setForm({
            name: r.restaurantName || r.name || '',
            contactEmail: r.email || r.contactEmail || '',
            contactPhone: r.phone || r.contactPhone || '',
            contactName: r.contactName || '',
            address: r.address || '',
            subscriptionPlan: r.subscription?.plan || 'trial',
            slug: r.slug || '',
            settings: r.systemSettings?.general || { timezone: 'UTC', currency: 'USD', language: 'en' }
          });
        }
      } catch (err) {
        console.error('Failed to load restaurant', err);
        setError(err.response?.data?.message || err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, auth]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{params.id ? 'Edit' : 'Create'} Restaurant</h1>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={submit} className="bg-white rounded shadow p-6 max-w-2xl">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm">Restaurant Name *</label>
            <input value={form.name} onChange={e => onChange('name', e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm">Contact Email *</label>
            <input value={form.contactEmail} onChange={e => onChange('contactEmail', e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Contact Phone</label>
              <input value={form.contactPhone} onChange={e => onChange('contactPhone', e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm">Contact Name</label>
              <input value={form.contactName} onChange={e => onChange('contactName', e.target.value)} className="w-full p-2 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-sm">Address</label>
            <input value={form.address} onChange={e => onChange('address', e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm">Subscription Plan</label>
            <select value={form.subscriptionPlan} onChange={e => onChange('subscriptionPlan', e.target.value)} className="w-full p-2 border rounded">
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Custom Slug</label>
            <input value={form.slug} onChange={e => onChange('slug', e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
