// FilterBar.jsx - Filter orders by status
import React from "react";
import { Filter } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders", color: "text-slate-600" },
  { value: "pending", label: "Pending", color: "text-yellow-600" },
  { value: "confirmed", label: "Confirmed", color: "text-blue-600" },
  { value: "preparing", label: "Preparing", color: "text-orange-600" },
  { value: "ready", label: "Ready", color: "text-green-600" },
  { value: "completed", label: "Completed", color: "text-emerald-600" },
  { value: "cancelled", label: "Cancelled", color: "text-red-600" },
];

export default function FilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-5 h-5 text-slate-600" />
        <h3 className="font-bold text-slate-900">Filter by Status</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() => onFilterChange(status.value)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              activeFilter === status.value
                ? "bg-amber-600 text-white shadow-lg scale-105"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}
