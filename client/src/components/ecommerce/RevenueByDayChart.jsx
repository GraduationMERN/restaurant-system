import Chart from "react-apexcharts";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useTranslation } from "react-i18next";

export default function RevenueByDayChart() {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(false);
  const [viewMode, setViewMode] = useState("day"); // "day" or "month"
  const [dayData, setDayData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load day of week data
        const dayRes = await api.get(`/api/orders/stats/revenue-by-day`);
        setDayData(dayRes.data?.data || []);
        
        // Load monthly data
        const monthRes = await api.get(`/api/orders/stats/monthly`);
        setMonthData(monthRes.data?.data || []);
      } catch (e) {
        console.error("Failed to load revenue data", e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#E5E7EB';

  const defaultDayData = [
    { day: "Sun", revenue: 0 },
    { day: "Mon", revenue: 0 },
    { day: "Tue", revenue: 0 },
    { day: "Wed", revenue: 0 },
    { day: "Thu", revenue: 0 },
    { day: "Fri", revenue: 0 },
    { day: "Sat", revenue: 0 },
  ];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const chartData = viewMode === "day" 
    ? (dayData.length ? dayData : defaultDayData)
    : monthData;

  const categories = viewMode === "day"
    ? chartData.map(d => t(`admin.days.${d.day}`) || d.day)
    : chartData.map(d => {
        const mName = monthNames[d.month - 1];
        return t(`admin.months.${mName}`) || mName || d.month;
      });

  const values = chartData.map(d => d.revenue || 0);

  const dayColors = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#06B6D4"];
  const monthColors = ["#3B82F6"];

  const options = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      foreColor: textColor,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: viewMode === "day" ? '50%' : '40%',
        distributed: viewMode === "day",
      }
    },
    colors: viewMode === "day" ? dayColors : monthColors,
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: categories,
      labels: { style: { colors: textColor } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: textColor },
        formatter: (val) => `$${Math.round(val)}`
      }
    },
    grid: {
      borderColor: gridColor,
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => `$${val?.toFixed(2) || 0}` }
    }
  };

  const series = [{ name: t("admin.revenue_by_day"), data: values }];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900/50 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {viewMode === "day" ? t("admin.revenue_by_day") : t("admin.monthly_revenue")}
        </h3>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "day"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {t("admin.by_day")}
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "month"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {t("admin.monthly")}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[250px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Chart key={`${isDark}-${viewMode}`} options={options} series={series} type="bar" height={250} />
      )}
    </div>
  );
}

