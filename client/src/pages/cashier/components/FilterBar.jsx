// FilterBar.jsx - Filter orders by status
import React from "react";
import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

const getStatusOptions = (t) => [
  { value: "all", label: t("all_orders"), color: "text-slate-600" },
  { value: "pending", label: t("admin.pending"), color: "text-yellow-600" },
  { value: "confirmed", label: t("admin.confirmed"), color: "text-blue-600" },
  { value: "preparing", label: t("admin.preparing"), color: "text-orange-600" },
  { value: "ready", label: t("admin.ready"), color: "text-green-600" },
  { value: "completed", label: t("admin.completed"), color: "text-emerald-600" },
  { value: "cancelled", label: t("admin.cancelled"), color: "text-red-600" },
];

export default function FilterBar({ activeFilter, onFilterChange }) {
  const { t } = useTranslation();
  const STATUS_OPTIONS = getStatusOptions(t);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-5 h-5 text-slate-600" />
        <h3 className="font-bold text-slate-900 dark:text-white">{t("filter_by_status")}</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() => onFilterChange(status.value)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              activeFilter === status.value
                ? "bg-amber-600 text-white shadow-lg scale-105"
                : "bg-slate-100 text-slate-700 dark:text-white dark:border-gray-800  dark:bg-gray-700 hover:text-white hover:bg-slate-200 border dark:hover:bg-gray-900 dark:hover:border-gray-800"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}
