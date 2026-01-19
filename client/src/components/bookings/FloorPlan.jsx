import React from "react";
import Button from "../ui/button/Button";

export default function FloorPlan({ tables = [], onToggleStatus = () => {}, onSelectTable = () => {}, onDropBooking = () => {} }) {
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {tables.length === 0 && <div className="text-sm text-gray-500">No tables</div>}
        {tables.map((t) => (
          <div
            key={t._id}
            className={`p-3 rounded text-center border ${t.status === 'available' ? 'bg-green-50' : t.status === 'reserved' ? 'bg-yellow-50' : 'bg-red-50'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const bookingId = e.dataTransfer.getData('text/plain');
              if (bookingId) onDropBooking(t, bookingId);
            }}
          >
            <div className="font-medium">{t.name || t._id}</div>
            <div className="text-sm text-gray-500">{t.capacity}</div>
            <div className="mt-2 flex justify-center gap-2">
              <Button size="xs" onClick={() => onSelectTable(t)}>{t.status}</Button>
              <Button size="xs" variant="outline" onClick={() => onToggleStatus(t)}>
                Toggle
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
