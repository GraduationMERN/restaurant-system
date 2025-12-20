import Chart from "react-apexcharts";
import { useEffect, useState, useMemo } from "react";

export default function MonthlySalesChart({ title = "Top Selling Items", labels = [], series = [] }) {
  const [isDark, setIsDark] = useState(false);

  // Debug: Log received props
  console.log("MonthlySalesChart received props:", { labels, series });

  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains('dark'));

    // Watch for theme changes
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

  // Limit to top 5 items, aggregate rest into "Others"
  const { displayLabels, displaySeries, hasData } = useMemo(() => {
    console.log("useMemo calculating with:", { labels, series });
    if (!labels.length || !series.length) {
      console.log("No data - returning fallback");
      return { 
        displayLabels: ["No data available"], 
        displaySeries: [1],
        hasData: false
      };
    }

    // Combine labels and series, sort by quantity descending
    const items = labels.map((label, i) => ({ label, value: series[i] || 0 }));
    items.sort((a, b) => b.value - a.value);

    const MAX_ITEMS = 5;
    
    if (items.length <= MAX_ITEMS) {
      return { 
        displayLabels: items.map(i => i.label), 
        displaySeries: items.map(i => i.value),
        hasData: true
      };
    }

    // Take top 5, aggregate rest
    const topItems = items.slice(0, MAX_ITEMS);
    const othersTotal = items.slice(MAX_ITEMS).reduce((sum, i) => sum + i.value, 0);

    const result = {
      displayLabels: [...topItems.map(i => i.label), "Others"],
      displaySeries: [...topItems.map(i => i.value), othersTotal],
      hasData: true
    };
    console.log("useMemo result:", result);
    return result;
  }, [labels, series]);

  const textColor = isDark ? '#E5E7EB' : '#374151';


  const options = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      foreColor: textColor,
    },
    labels: displayLabels,
    colors: ["#465FFF", "#9CB9FF", "#F87171", "#F59E0B", "#10B981", "#6B7280"],
    dataLabels: { enabled: false },
    legend: { 
      position: "bottom",
      labels: {
        colors: textColor,
      }
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
              fontSize: '22px',
              fontWeight: 700,
              color: textColor,
              formatter: (val) => `${val} orders`
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 600,
              color: textColor,
              formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) + ' orders'
            }
          }
        }
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">{title}</h3>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[350px] xl:min-w-full">
          <Chart 
            key={`${isDark}-${displayLabels.join(',')}-${displaySeries.join(',')}`} 
            options={options} 
            series={displaySeries} 
            type="donut" 
            height={280} 
          />
        </div>
      </div>
    </div>
  );
}



