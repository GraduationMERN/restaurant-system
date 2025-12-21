import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon, DollarLineIcon, ShootingStarIcon } from "../../icons/admin-icons";
import Badge from "../ui/badge/Badge";

import { useTranslation } from "react-i18next";

export default function EcommerceMetrics({ metrics }) {
  const { t } = useTranslation();
  
  const cards = [
    {
      label: t("admin.todays_sales"),
      value: `$${(metrics?.sales?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      change: metrics?.sales?.changePct || 0,
      icon: DollarLineIcon,
    },
    {
      label: t("admin.orders"),
      value: `${metrics?.orders?.value || 0}`,
      change: metrics?.orders?.changePct || 0,
      icon: BoxIconLine,
    },
    {
      label: t("admin.customers"),
      value: `${metrics?.customers?.value || 0}`,
      change: metrics?.customers?.changePct || 0,
      icon: GroupIcon,
    },
    {
      label: t("admin.avg_rating"),
      value: `${(metrics?.rating?.value || 0).toFixed(1)}`,
      change: metrics?.rating?.changePct || 0,
      icon: ShootingStarIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-3">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        const isUp = c.change >= 0;
        return (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <Icon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{c.label}</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{c.value}</h4>
              </div>
              <Badge color={isUp ? "success" : "error"}>
                {isUp ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(c.change).toFixed(2)}%
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
