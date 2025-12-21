// SortBar.jsx - Sort orders by various criteria
import React from "react";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const getSortOptions = (t) => [
  { value: "newest", label: t("newest_first") },
  { value: "oldest", label: t("oldest_first") },
  { value: "shortest_prep", label: t("shortest_prep_time") },
  { value: "longest_prep", label: t("longest_prep_time") },
  { value: "fewest_items", label: t("fewest_items") },
  { value: "most_items", label: t("most_items") },
];

export default function SortBar({ activeSort, onSortChange }) {
  const { t } = useTranslation();
  const SORT_OPTIONS = getSortOptions(t);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <ArrowUpDown className="w-5 h-5 text-slate-600 dark:text-white" />
        <h3 className="font-bold text-slate-900 dark:text-white">{t("sort_orders")}</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((sort) => (
          <button
            key={sort.value}
            onClick={() => onSortChange(sort.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              activeSort === sort.value
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-100 dark:bg-gray-700 dark:text-white text-slate-700  hover:bg-slate-200 border dark:hover:bg-gray-900 dark:border-gray-700"
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>
    </div>
  );
}
