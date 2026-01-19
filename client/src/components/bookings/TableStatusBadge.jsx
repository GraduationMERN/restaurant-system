import React from "react";

export default function TableStatusBadge({ status }) {
  const classes = status === 'confirmed' ? 'bg-green-100 text-green-700' : status === 'seated' ? 'bg-yellow-100 text-yellow-700' : status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-1 rounded-full text-xs ${classes}`}>{status}</span>;
}
