import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useMemo } from "react";

export default function Dashboard() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const orders = useMemo(
    () => [
      {
        id: "#1001",
        customer: "John Doe",
        items: [
          { name: "Margherita Pizza", category: "Pizza", qty: 1, price: 12.99 },
          { name: "Coke", category: "Drinks", qty: 1, price: 2.99 },
        ],
        status: "Ready",
        rating: 4.5,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30),
      },
      {
        id: "#1002",
        customer: "Jane Smith",
        items: [
          { name: "Caesar Salad", category: "Salads", qty: 1, price: 10.99 },
          { name: "Tiramisu", category: "Desserts", qty: 1, price: 5.99 },
        ],
        status: "Pending",
        rating: 4.2,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 45),
      },
      {
        id: "#1003",
        customer: "Mike Johnson",
        items: [
          { name: "Pepperoni Pizza", category: "Pizza", qty: 2, price: 13.49 },
        ],
        status: "Completed",
        rating: 4.9,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 15),
      },
      {
        id: "#1004",
        customer: "Sarah Wilson",
        items: [
          { name: "Pasta Alfredo", category: "Pasta", qty: 1, price: 11.99 },
          { name: "Lemonade", category: "Drinks", qty: 1, price: 3.49 },
        ],
        status: "Ready",
        rating: 4.6,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
      },
      {
        id: "#1005",
        customer: "Tom Brown",
        items: [
          { name: "Gelato", category: "Desserts", qty: 2, price: 3.5 },
          { name: "Pasta Arrabiata", category: "Pasta", qty: 1, price: 12.49 },
        ],
        status: "Pending",
        rating: 4.0,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 10, 15),
      },
      {
        id: "#1006",
        customer: "Alice Green",
        items: [
          { name: "Minestrone Soup", category: "Meals", qty: 1, price: 8.5 },
          { name: "Pasta Carbonara", category: "Pasta", qty: 1, price: 12.99 },
        ],
        status: "Completed",
        rating: 4.7,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 16, 5),
      },
      {
        id: "#1007",
        customer: "Robert Fox",
        items: [
          { name: "Garlic Bread", category: "Meals", qty: 1, price: 4.5 },
          { name: "Orange Juice", category: "Drinks", qty: 1, price: 3.0 },
        ],
        status: "Completed",
        rating: 4.3,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4, 9, 50),
      },
    ],
    [today]
  );

  const orderTotal = (o) => o.items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => b.date - a.date)
        .slice(0, 5)
        .map((o) => ({
          id: o.id,
          customer: o.customer,
          itemsCount: `${o.items.reduce((s, it) => s + it.qty, 0)} items`,
          total: `$${orderTotal(o).toFixed(2)}`,
          status: o.status,
          time: `${o.date.getHours()}:${String(o.date.getMinutes()).padStart(2, "0")}`,
        })),
    [orders]
  );

  const labelsWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklySales = useMemo(() => {
    const sums = Array(7).fill(0);
    orders.forEach((o) => {
      const d = o.date.getDay();
      const idx = d === 0 ? 6 : d - 1;
      sums[idx] += orderTotal(o);
    });
    return sums;
  }, [orders]);

  const todaySales = useMemo(
    () =>
      orders
        .filter((o) => o.date >= startOfDay)
        .reduce((sum, o) => sum + orderTotal(o), 0),
    [orders, startOfDay]
  );

  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdaySales = useMemo(
    () =>
      orders
        .filter((o) => o.date >= yesterday && o.date < startOfDay)
        .reduce((sum, o) => sum + orderTotal(o), 0),
    [orders, startOfDay, yesterday]
  );

  const customersToday = new Set(
    orders.filter((o) => o.date >= startOfDay).map((o) => o.customer)
  ).size;
  const customersYesterday = new Set(
    orders.filter((o) => o.date >= yesterday && o.date < startOfDay).map((o) => o.customer)
  ).size;

  const ordersToday = orders.filter((o) => o.date >= startOfDay).length;
  const ordersYesterday = orders.filter((o) => o.date >= yesterday && o.date < startOfDay).length;

  const avgRatingToday = (() => {
    const list = orders.filter((o) => o.date >= startOfDay);
    if (!list.length) return 0;
    return list.reduce((s, o) => s + o.rating, 0) / list.length;
  })();
  const avgRatingYesterday = (() => {
    const list = orders.filter((o) => o.date >= yesterday && o.date < startOfDay);
    if (!list.length) return 0;
    return list.reduce((s, o) => s + o.rating, 0) / list.length;
  })();

  const pct = (a, b) => {
    if (b === 0) return a === 0 ? 0 : 100;
    return ((a - b) / b) * 100;
  };

  const metrics = {
    sales: { value: todaySales, changePct: pct(todaySales, yesterdaySales) },
    orders: { value: ordersToday, changePct: pct(ordersToday, ordersYesterday) },
    customers: { value: customersToday, changePct: pct(customersToday, customersYesterday) },
    rating: { value: avgRatingToday, changePct: pct(avgRatingToday, avgRatingYesterday) },
  };

  const topItemsAgg = useMemo(() => {
    const map = new Map();
    orders.forEach((o) =>
      o.items.forEach((it) => {
        const key = it.category;
        map.set(key, (map.get(key) || 0) + it.qty);
      })
    );
    const labels = Array.from(map.keys());
    const values = labels.map((l) => map.get(l));
    return { labels, values };
  }, [orders]);

  return (
    <>
      <PageMeta
        title="Dashboard"
        description="Restaurant admin dashboard"
      />
      <PageBreadcrumb pageTitle="Dashboard" />
      <div className="space-y-6">
        <EcommerceMetrics metrics={metrics} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StatisticsChart title="Sales Trend" categories={labelsWeek} series={[{ name: "Sales", data: weeklySales.map((v) => Math.round(v)) }]} />
          <MonthlySalesChart title="Top Selling Items" labels={topItemsAgg.labels} series={topItemsAgg.values} />
        </div>

        <div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Orders</h3>
            <RecentOrders orders={recentOrders} />
          </div>
        </div>
      </div>
    </>
  );
}
