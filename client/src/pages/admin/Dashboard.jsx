import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PeakHoursChart from "../../components/ecommerce/PeakHoursChart";
import RevenueByDayChart from "../../components/ecommerce/RevenueByDayChart";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState({
    sales: { value: 0, changePct: 0 },
    orders: { value: 0, changePct: 0 },
    customers: { value: 0, changePct: 0 },
    rating: { value: 0, changePct: 0 },
  });
  const [topLabels, setTopLabels] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [peakHours, setPeakHours] = useState([]);

  useEffect(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    const iso = (d) => new Date(d).toISOString();

    async function loadMetrics() {
      try {
        const [todayRes, yRes] = await Promise.all([
          api.get(`/api/orders/stats/overview`, { params: { from: iso(startOfDay), to: iso(today) } }),
          api.get(`/api/orders/stats/overview`, { params: { from: iso(yesterday), to: iso(startOfDay) } }),
        ]);
        const t = todayRes.data?.data || {};
        const y = yRes.data?.data || {};
        const pct = (a, b) => {
          const av = Number(a || 0);
          const bv = Number(b || 0);
          if (bv === 0) return av === 0 ? 0 : 100;
          return ((av - bv) / bv) * 100;
        };
        setMetrics({
          sales: { value: t.totalRevenue || 0, changePct: pct(t.totalRevenue, y.totalRevenue) },
          orders: { value: t.orderCount || 0, changePct: pct(t.orderCount, y.orderCount) },
          customers: { value: t.customersCount || 0, changePct: pct(t.customersCount, y.customersCount) },
          rating: { value: Number((t.avgRating || 0).toFixed(1)), changePct: pct(t.avgRating, y.avgRating) },
        });
      } catch (e) {
        console.error("Failed to load overview stats", e);
      }
    }

    async function loadTopItems() {
      try {
        const res = await api.get(`/api/orders/stats/top-items`, { params: { by: "product" } });
        const data = res.data?.data || [];
        if (data.length > 0) {
          setTopLabels(data.map((x) => x.label || x.name || t("admin.unknown")));
          setTopSeries(data.map((x) => x.quantity || 0));
        }
      } catch (e) {
        console.error("Failed to load top items", e);
      }
    }

    async function loadRecent() {
      try {
        const res = await api.get(`/api/orders/recent`, { params: { limit: 5 } });
        const data = res.data?.data || [];
        const mapped = data.map((o) => ({
          id: o.orderNumber || (o._id || "").toString().slice(-8),
          customer: o.customerInfo?.name || o.userId?.name || t("admin.guest"),
          itemsCount: t("admin.items_count", { count: (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0) }),
          total: `$${Number(o.totalAmount || 0).toFixed(2)}`,
          status: (o.status || "").replace(/\b\w/g, (c) => c.toUpperCase()),
          time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setRecentOrders(mapped);
      } catch (e) {
        console.error("Failed to load recent orders", e);
      }
    }

    async function loadPeakHours() {
      try {
        const res = await api.get(`/api/orders/stats/peak-hours`);
        setPeakHours(res.data?.data || []);
      } catch (e) {
        console.error("Failed to load peak hours", e);
      }
    }

    loadMetrics();
    loadTopItems();
    loadRecent();
    loadPeakHours();
  }, []);

  const topItemsAgg = useMemo(() => ({ labels: topLabels, values: topSeries }), [topLabels, topSeries]);

  return (
    <>
      <PageMeta
        title={t("admin.dashboard_title")}
        description={t("admin.dashboard_desc")}
      />
      <PageBreadcrumb pageTitle={t("admin.dashboard_title")} />
      
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <EcommerceMetrics metrics={metrics} />
            </div>
          </div>

          {/* Row 1: Sales Trend - Full Width */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <StatisticsChart title={t("admin.sales_trend")} />
            </div>
          </div>

          {/* Row 2: Top Selling & Revenue by Day */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <MonthlySalesChart 
                  title={t("admin.top_selling")} 
                  labels={topItemsAgg.labels} 
                  series={topItemsAgg.values} 
                />
                <RevenueByDayChart />
              </div>
            </div>
          </div>

          {/* Row 3: Peak Hours - Full Width */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <PeakHoursChart data={peakHours} />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50 sm:p-5 lg:p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t("admin.recent_orders")}</h3>
                <RecentOrders orders={recentOrders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
