import React from 'react';
import ComponentCard from '../../../components/common/ComponentCard';
import { Package, ChefHat, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StatsCards = ({
  confirmedOrders,
  preparingOrders,
  readyOrders,
  avgPreparationTime
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ComponentCard className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">{t("admin.confirmed_orders")}</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{confirmedOrders.length}</p>
          </div>
          <Package className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
      </ComponentCard>

      <ComponentCard className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 dark:text-purple-400">{t("admin.preparing")}</p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{preparingOrders.length}</p>
          </div>
          <ChefHat className="h-8 w-8 text-purple-500 dark:text-purple-400" />
        </div>
      </ComponentCard>

      <ComponentCard className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 dark:text-green-400">{t("ready_for_pickup")}</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{readyOrders.length}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
        </div>
      </ComponentCard>

      <ComponentCard className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/10 dark:to-amber-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-600 dark:text-amber-400">{t("avg_prep_time")}</p>
            <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{avgPreparationTime} {t("min_short")}</p>
          </div>
          <Clock className="h-8 w-8 text-amber-500 dark:text-amber-400" />
        </div>
      </ComponentCard>
    </div>
  );
};

export default StatsCards;