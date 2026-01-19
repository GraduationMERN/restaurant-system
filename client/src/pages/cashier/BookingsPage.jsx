import React, { useEffect, useState } from "react";
import BookingList from "../../components/bookings/BookingList";
import FloorPlan from "../../components/bookings/FloorPlan";
import BookingDetailsModal from "../../components/bookings/BookingDetailsModal";
import api from "../../api/axios";
import Button from "../../components/ui/button/Button";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const fetchData = async () => {
    try {
      const b = await api.get("api/bookings/upcoming");
      setBookings(b.data || []);
      const t = await api.get("api/tables/floor-plan");
      setTables(t.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onUpdateStatus = async (id, status) => {
    await api.patch(`api/bookings/${id}/status`, { status });
    setBookings((prev) => prev.map((x) => (String(x._id) === String(id) ? { ...x, status } : x)));
  };

  const assign = async (table, bookingId) => {
    await api.put(`api/bookings/${bookingId}`, { tableId: table._id });
    setBookings((prev) => prev.map((b) => (String(b._id) === String(bookingId) ? { ...b, tableId: table } : b)));
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bookings Management</h2>
        <Button onClick={fetchData}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <BookingList bookings={bookings} onUpdateStatus={onUpdateStatus} onSelect={(b) => { setSelected(b); setOpen(true); }} />
        </div>
        <div className="md:col-span-2">
          <FloorPlan tables={tables} onDropBooking={assign} onToggleStatus={async (t) => { const next = t.status === 'available' ? 'reserved' : 'available'; await api.patch(`api/tables/${t._id}/status`, { status: next }); fetchData(); }} onSelectTable={(t) => { setSelected(t); setOpen(true); }} />
        </div>
      </div>

      <BookingDetailsModal booking={selected} open={open} onClose={() => setOpen(false)} onSave={async (id, data) => { await api.put(`api/bookings/${id}`, data); fetchData(); }} tables={tables} />
    </div>
  );
}
