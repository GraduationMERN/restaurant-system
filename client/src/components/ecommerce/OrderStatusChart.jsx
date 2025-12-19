import Chart from "react-apexcharts";
import { useEffect, useState } from "react";

export default function OrderStatusChart({ data = [] }) {
  const [isDark, setIsDark] = useState(false);

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

  const textColor = isDark ? '#E5E7EB' : '#374151';

  // Status colors
  const statusColors = {
    pending: "#F59E0B",
    confirmed: "#3B82F6", 
    preparing: "#8B5CF6",
    ready: "#10B981",
    completed: "#059669",
    cancelled: "#EF4444"
  };

  const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  // Format data
  const chartData = data.length ? data : [];
  const labels = chartData.map(d => statusLabels[d._id] || d._id);
  const series = chartData.map(d => d.count || 0);
  const colors = chartData.map(d => statusColors[d._id] || "#6B7280");

  const totalOrders = series.reduce((a, b) => a + b, 0);

  const options = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      foreColor: textColor,
    },
    labels: labels.length ? labels : ["No Data"],
    colors: colors.length ? colors : ["#6B7280"],
    dataLabels: { enabled: false },
    legend: { 
      position: "bottom",
      labels: { colors: textColor }
    },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              offsetY: -5,
              color: textColor
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: textColor,
              formatter: (val) => val
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 600,
              color: textColor,
              formatter: () => totalOrders
            }
          }
        }
      }
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900/50 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Order Status</h3>
      <Chart 
        key={`${isDark}-${labels.join(',')}-${series.join(',')}`} 
        options={options} 
        series={series.length ? series : [1]} 
        type="donut" 
        height={280} 
      />
    </div>
  );
}
