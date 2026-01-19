// CashierDashboard.jsx - Main cashier dashboard
import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  CreditCard,
  ArrowRight,
  RefreshCw,
  Calendar,
  TrendingUp
} from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";
import OrdersTab from "./components/OrdersTab";
import DirectOrderTab from "./components/DirectOrderTab";
import api from "../../api/axios";
import { useSettings } from '../../context/SettingContext';
import { useRole } from "../../hooks/useRole";
import StaffNavbar from "../../components/StaffNavbar";
import { useTranslation } from "react-i18next";

export default function CashierDashboard() {
  const { t } = useTranslation();
  const { isCashier, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState("orders");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    pendingPayments: 0,
  });
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  // Fetch statistics
  useEffect(() => {
    fetchStats();
    fetchTodayBookingsCount();
  }, []);

  const fetchTodayBookingsCount = async () => {
    try {
      const rid = settings?.restaurantId || settings?._id || null;
      const q = rid ? `?restaurantId=${rid}` : '';
      const res = await api.get(`/api/bookings/today${q}`);
      const list = res.data?.data ?? res.data ?? [];
      setTodayBookingsCount(Array.isArray(list) ? list.length : 0);
    } catch (err) {
      console.warn('Failed to fetch today bookings count', err?.response?.data || err.message || err);
      setTodayBookingsCount(0);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("api/orders/all-orders-rewards");
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
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = (order) => {
    setRefreshKey((prev) => prev + 1);
    fetchStats();
    setActiveTab("orders");
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchStats();
    fetchTodayBookingsCount();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleManageBookings = () => {
    navigate('/cashier/bookings');
  };

  return (
    <>
      <PageMeta title={t("admin.cashier_dashboard")} description={t("admin.cashier_desc")} />
      {isAdmin && <PageBreadcrumb pageTitle={t("admin.cashier_dashboard")} />}
      {isCashier && <StaffNavbar />}  
      
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header with Stats Summary */}
        <ComponentCard className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span>{t("admin.cashier_dashboard")}</span>
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                {t("admin.cashier_desc")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center gap-2 transition-all duration-200 hover:shadow-md"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {loading ? t("loading") : t("admin.refresh")}
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Stats Cards - Improved Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Orders Card */}
          <ComponentCard className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border border-blue-100 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  {t("admin.total_orders")}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.totalOrders}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>All time orders</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </ComponentCard>

          {/* Active Orders Card */}
          <ComponentCard className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800 border border-amber-100 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Active Orders
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.activeOrders}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>In progress</span>
                </div>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </ComponentCard>

        

          {/* Pending Payments Card */}
          <ComponentCard className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-gray-800 border border-rose-100 dark:border-rose-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                  {t("admin.pending_payments")}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.pendingPayments}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Awaiting payment</span>
                </div>
              </div>
              <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </ComponentCard>

            {/* Today's Bookings Card */}
          <ComponentCard className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 border border-emerald-100 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-md">
                      <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Today's Bookings
                    </p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {todayBookingsCount}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Table reservations
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <Button
                  onClick={handleManageBookings}
                  variant="outline"
                  size="sm"
                  className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-center gap-2"
                >
                  Manage Tables
                  <ArrowRight className="h-4 w-4  " />
                </Button>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Revenue Card (Full Width) */}
        <ComponentCard className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Revenue
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Combined earnings from all orders
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                All time revenue
              </p>
            </div>
          </div>
        </ComponentCard>

        {/* Tab Content */}
        <ComponentCard className="border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all duration-200 ${
                activeTab === "orders"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className={`p-1.5 rounded-md ${activeTab === "orders" ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <ShoppingCart className="h-4 w-4" />
              </div>
               {t("admin.manage_orders")}
            </button>
            <button
              onClick={() => setActiveTab("direct")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all duration-200 ${
                activeTab === "direct"
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className={`p-1.5 rounded-md ${activeTab === "direct" ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <div className="h-4 w-4 flex items-center justify-center">+</div>
              </div>
               {t("admin.create_direct_order")}
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