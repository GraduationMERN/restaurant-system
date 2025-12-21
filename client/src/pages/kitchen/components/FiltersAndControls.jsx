import React from 'react';
import ComponentCard from '../../../components/common/ComponentCard';
import { SortAsc } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FiltersAndControls = ({ filterStatus, setFilterStatus, sortBy, setSortBy }) => {
  const { t } = useTranslation();
  return (
    <ComponentCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["active", "confirmed", "preparing", "ready"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-brand-500 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {t("admin." + status)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-800 text-sm"
            >
              <option value="createdAt">{t("oldest_first")}</option>
              <option value="-createdAt">{t("newest_first")}</option>
              <option value="estimatedTime">{t("shortest_time")}</option>
              <option value="-estimatedTime">{t("longest_time")}</option>
              <option value="itemsCount">{t("fewest_items")}</option>
              <option value="-itemsCount">{t("most_items")}</option>
            </select>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default FiltersAndControls;