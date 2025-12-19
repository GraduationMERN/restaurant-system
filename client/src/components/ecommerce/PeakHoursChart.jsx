import Chart from "react-apexcharts";
import { useEffect, useState } from "react";

export default function PeakHoursChart({ data = [] }) {
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

  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#E5E7EB';

  // Format hours for display
  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const chartData = data.length ? data : Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

  const options = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      foreColor: textColor,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      }
    },
    colors: ["#10B981"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.map(d => formatHour(d.hour)),
      labels: {
        style: { colors: textColor, fontSize: '10px' },
        rotate: -45,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: textColor },
        formatter: (val) => Math.round(val)
      }
    },
    grid: {
      borderColor: gridColor,
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => `${val} orders` }
    }
  };

  const series = [{ name: "Orders", data: chartData.map(d => d.count) }];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900/50 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Peak Hours</h3>
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px]">
          <Chart key={isDark ? 'dark' : 'light'} options={options} series={series} type="bar" height={250} />
        </div>
      </div>
    </div>
  );
}
