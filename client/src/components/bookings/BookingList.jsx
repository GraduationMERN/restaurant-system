import React, { useState, useMemo } from "react";
import Button from "../ui/button/Button";
import TableStatusBadge from "./TableStatusBadge";

export default function BookingList({ bookings = [], onUpdateStatus = () => {}, onSelect = () => {} }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => (b.customerName || "").toLowerCase().includes(q) || (b.tableId && (b.tableId.name || "").toString().toLowerCase().includes(q)));
  }, [bookings, query]);

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bookings or table" className="flex-1 border rounded p-2" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-sm text-gray-500">No bookings</div>}
        {filtered.map((b) => (
          <div key={b._id} className="flex items-center justify-between p-2 border rounded" draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', b._id); }}>
            <div>
              <div className="font-medium">{b.customerName || 'Guest'}</div>
              <div className="text-sm text-gray-500">{b.startTime} • {b.guests} guests • {b.tableId ? (b.tableId.name || b.tableId) : 'Unassigned'}</div>
            </div>
            <div className="flex items-center gap-2">
              <TableStatusBadge status={b.status} />
              <Button size="xs" onClick={() => onUpdateStatus(b._id, 'seated')}>Mark Seated</Button>
              <Button size="xs" variant="outline" onClick={() => onUpdateStatus(b._id, 'cancelled')}>Cancel</Button>
              <Button size="xs" variant="ghost" onClick={() => onSelect(b)}>Details</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
