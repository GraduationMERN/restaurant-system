import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    sales: { value: 0, changePct: 0 },
    orders: { value: 0, changePct: 0 },
    customers: { value: 0, changePct: 0 },
    rating: { value: 0, changePct: 0 },
  });
  const [weeklyCategories, setWeeklyCategories] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [topLabels, setTopLabels] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

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

    async function loadDaily() {
      try {
        const res = await api.get(`/api/orders/stats/daily`, { params: { days: 7 } });
        const data = res.data?.data || [];
        const cats = data.map((d) => d._id);
        const vals = data.map((d) => Math.round(d.revenue || 0));
        setWeeklyCategories(cats);
        setWeeklySales(vals);
      } catch (e) {
        console.error("Failed to load daily stats", e);
      }
    }

    async function loadTopItems() {
      try {
        const from = new Date();
        from.setMonth(from.getMonth() - 1);
        const res = await api.get(`/api/orders/stats/top-items`, { params: { from: iso(from), to: iso(today), by: "product" } });
        const data = res.data?.data || [];
        setTopLabels(data.map((x) => x.label || "Unknown"));
        setTopSeries(data.map((x) => x.quantity || 0));
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
          customer: o.customerInfo?.name || o.userId?.name || "Guest",
          itemsCount: `${(o.items || []).reduce((s, it) => s + (it.quantity || 0), 0)} items`,
          total: `$${Number(o.totalAmount || 0).toFixed(2)}`,
          status: (o.status || "").replace(/\b\w/g, (c) => c.toUpperCase()),
          time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setRecentOrders(mapped);
      } catch (e) {
        console.error("Failed to load recent orders", e);
      }
    }

    loadMetrics();
    loadDaily();
    loadTopItems();
    loadRecent();
  }, []);

  const topItemsAgg = useMemo(() => ({ labels: topLabels, values: topSeries }), [topLabels, topSeries]);

  return (
    <>
      <PageMeta
        title="Dashboard"
        description="Restaurant admin dashboard"
      />
      <PageBreadcrumb pageTitle="Dashboard" />
      
      {/* Main content container - centered on small/medium screens */}
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Center EcommerceMetrics on small/medium screens */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <EcommerceMetrics metrics={metrics} />
            </div>
          </div>

          {/* Charts grid - centered on small/medium screens */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <StatisticsChart 
                  title="Sales Trend" 
                  categories={weeklyCategories} 
                  series={[{ name: "Sales", data: weeklySales }]} 
                />
                <MonthlySalesChart 
                  title="Top Selling Items" 
                  labels={topItemsAgg.labels} 
                  series={topItemsAgg.values} 
                />
              </div>
            </div>
          </div>

          {/* Recent Orders - centered on small/medium screens */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5 lg:p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Orders</h3>
                <RecentOrders orders={recentOrders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}