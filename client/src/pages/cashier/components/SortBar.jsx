// SortBar.jsx - Sort orders by various criteria
import React from "react";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "shortest_prep", label: "Shortest Prep Time" },
  { value: "longest_prep", label: "Longest Prep Time" },
  { value: "fewest_items", label: "Fewest Items" },
  { value: "most_items", label: "Most Items" },
];

export default function SortBar({ activeSort, onSortChange }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <ArrowUpDown className="w-5 h-5 text-slate-600" />
        <h3 className="font-bold text-slate-900">Sort Orders</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((sort) => (
          <button
            key={sort.value}
            onClick={() => onSortChange(sort.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              activeSort === sort.value
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>
    </div>
  );
}
