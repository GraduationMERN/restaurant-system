import React, { useEffect, useState } from "react";
import api from "../../api/axios";

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState([]);
  const [date, setDate] = useState("");

  useEffect(()=>{ fetch(); }, []);

  const fetch = async () => {
    try {
      const q = date ? `?date=${date}` : "";
      const res = await api.get(`/api/bookings${q}`);
      setBookings(res.data || res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/bookings/${id}`, { status });
      fetch();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">Bookings</h3>
      <div className="mb-4">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input mr-2" />
        <button onClick={fetch} className="btn">Filter</button>
      </div>
      <div>
        <ul className="space-y-2">
          {bookings.map(b => (
            <li key={b._id} className="p-3 border rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{b.customerName || b.customerPhone}</div>
                  <div className="text-sm">{b.date} {b.startTime}-{b.endTime} — guests {b.guests}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={()=>updateStatus(b._id, 'confirmed')} className="btn btn-sm">Confirm</button>
                  <button onClick={()=>updateStatus(b._id, 'cancelled')} className="btn btn-sm">Cancel</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
