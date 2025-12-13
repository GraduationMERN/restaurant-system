// CashierDashboard.jsx - Main cashier dashboard
import React, { useState, useEffect } from "react";
import { ShoppingCart, DollarSign, Clock, AlertCircle, CreditCard } from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import OrdersTab from "./components/OrdersTab";
import DirectOrderTab from "./components/DirectOrderTab";
import api from "../../api/axios";
import { useToast } from "../../hooks/useToast";

export default function CashierDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch statistics
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders");
      const orders = response.data.data || response.data || [];

      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      const activeOrders = orders.filter(
        (o) => ["pending", "confirmed", "preparing", "ready"].includes(o.status)
      ).length;
      const pendingPayments = orders.filter((o) => o.paymentStatus === "pending").length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        activeOrders,
        pendingPayments,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.showToast({ message: "Failed to load statistics", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = (order) => {
    toast.showToast({ message: "✅ Order created successfully!", type: "success" });
    setRefreshKey((prev) => prev + 1);
    fetchStats();
    setActiveTab("orders");
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchStats();
    toast.showToast({ message: "🔄 Refreshed!", type: "success" });
  };

  return (
    <>
      <PageMeta title="Cashier Dashboard" description="Manage orders and payments" />
      <PageBreadcrumb pageTitle="Cashier Dashboard" />

      <div className="space-y-6">
        {/* Header with Stats Summary */}
        <ComponentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cashier Dashboard
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage orders and process payments
              </p>
            </div>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </ComponentCard>

        {/* Stats Cards - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Orders</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500 dark:text-blue-400 opacity-50" />
            </div>
          </ComponentCard>

          <ComponentCard className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 dark:text-green-400 opacity-50" />
            </div>
          </ComponentCard>

          <ComponentCard className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Active Orders</p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">{stats.activeOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 dark:text-orange-400 opacity-50" />
            </div>
          </ComponentCard>

          <ComponentCard className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Pending Payments</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300">{stats.pendingPayments}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-500 dark:text-red-400 opacity-50" />
            </div>
          </ComponentCard>
        </div>

        {/* Tab Content */}
        <ComponentCard>
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === "orders"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              📋 Manage Orders
            </button>
            <button
              onClick={() => setActiveTab("direct")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === "direct"
                  ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              ➕ Create Direct Order
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "orders" && <OrdersTab key={refreshKey} />}
            {activeTab === "direct" && <DirectOrderTab onOrderCreated={handleOrderCreated} />}
          </div>
        </ComponentCard>
      </div>
    </>
  );
}