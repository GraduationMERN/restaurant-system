import Chart from "react-apexcharts";
import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import { useTranslation } from "react-i18next";

export default function StatisticsChart({ title = "Sales Trend" }) {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(false);
  const [days, setDays] = useState(7);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
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

  // Fetch data when days change
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get(`/api/orders/stats/daily`, { params: { days } });
        const data = res.data?.data || [];
        setCategories(data.map((d) => d._id));
        setSeries([{ name: "Sales", data: data.map((d) => Math.round(d.revenue || 0)) }]);
      } catch (e) {
        console.error("Failed to load daily stats", e);
      }
      setLoading(false);
    }
    loadData();
  }, [days]);

  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#E5E7EB';

  const totalSales = useMemo(() => {
    if (series.length && series[0]?.data) {
      return series[0].data.reduce((a, b) => a + b, 0);
    }
    return 0;
  }, [series]);

  const options = {
    legend: { show: false },
    colors: ["#8B5CF6"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 300,
      type: "area",
      foreColor: textColor,
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: "#8B5CF6", opacity: 0.6 },
          { offset: 100, color: "#4C1D95", opacity: 0.1 }
        ]
      }
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 8 },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => `$${Math.round(val).toLocaleString()}` },
    },
    xaxis: {
      type: "category",
      categories: categories.length ? categories : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: textColor, fontSize: "11px" },
        rotate: -45,
        rotateAlways: days > 14,
      },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        formatter: (val) => `$${Math.round(val)}`,
        style: { fontSize: "12px", colors: [textColor] },
      },
    },
  };

  const seriesKey = series.length && series[0]?.data ? series[0].data.join(',') : 'default';

  const dayOptions = [
    { value: 7, label: t("admin.x_days", { days: 7 }) },
    { value: 14, label: t("admin.x_days", { days: 14 }) },
    { value: 30, label: t("admin.x_days", { days: 30 }) },
    { value: 60, label: t("admin.x_days", { days: 60 }) },
    { value: 90, label: t("admin.x_days", { days: 90 }) },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/80">
      {/* Header with stats and filter */}
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {dayOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-baseline gap-4 mb-4">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            ${totalSales.toLocaleString()}
          </span>
          <span className="text-sm text-green-500 font-medium">{t("admin.last_x_days", {days})}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <Chart 
            key={`${isDark}-${seriesKey}`}
            options={options} 
            series={series.length ? series : [{ name: "Sales", data: [] }]} 
            type="area" 
            height={280} 
          />
        )}
      </div>
    </div>
  );
}
