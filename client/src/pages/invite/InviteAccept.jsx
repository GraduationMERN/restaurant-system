import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function InviteAccept() {
  const params = useParams();
  // token can be either a path param or query string (?token=...)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const token = params?.token || (searchParams && searchParams.get('token')) || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/invite/validate/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Invalid invitation');
        }
        const data = await res.json();
        setInvite(data.invitation);
        setRestaurant(data.restaurant);
        setForm(f => ({ ...f, email: data.invitation.email || '' }));
      } catch (err) {
        setError(err.message || 'Failed to validate invitation');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchInvite();
  }, [token]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { token, name: form.name, email: form.email, password: form.password };
      console.log('Submitting invite accept:', payload);
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', res.status);
      const body = await res.json();
      console.log('Response body:', body);
      
      if (!res.ok) {
        const errorMsg = body.message || body.error || 'Failed to accept invitation';
        console.error('Server error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Accept successful:', body);
      
      // Store tokens
      if (body.accessToken) {
        window.localStorage.setItem('accessToken', body.accessToken);
        console.log('Stored accessToken');
      }
      if (body.refreshToken) {
        window.localStorage.setItem('refreshToken', body.refreshToken);
        console.log('Stored refreshToken');
      }
      
      // Small delay to ensure localStorage is synced, then redirect to admin dashboard
      console.log('Redirecting to /admin');
      setTimeout(() => {
        navigate('/admin');
      }, 300);
    } catch (err) {
      const errorMsg = err.message || 'Submit failed';
      console.error('Catch block error:', err);
      setError(errorMsg);
    }
  };

  if (loading) return <div className="p-6">Validating invitation...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Accept Invitation</h1>
      <div className="mb-4">
        <div><strong>Restaurant:</strong> {restaurant?.restaurantName || 'Unknown'}</div>
        <div><strong>Invited email:</strong> {invite?.email}</div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input name="name" value={form.name} onChange={onChange} className="mt-1 block w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" value={form.email} onChange={onChange} className="mt-1 block w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input type="password" name="password" value={form.password} onChange={onChange} className="mt-1 block w-full border rounded px-3 py-2" required />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Accept and Sign In</button>
        </div>
      </form>
    </div>
  );
}
