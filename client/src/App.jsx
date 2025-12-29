import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ReviewsPage from "./pages/ReviewsPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./components/Layout";
import RewardPage from "./pages/RewardPage";
import Admin from "./pages/admin/Admin";
import Coupons from "./pages/admin/Coupons";
import AppLayout from "./layout/admin-layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { getMe, refreshToken } from "./redux/slices/authSlice";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoadingSpinner from "./components/LoadingSpinner";
import OrdersPage from "./pages/orders/OrdersPage";
import OrderDetailsPage from "./pages/orders/OrderDetailsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import MenuPage from "./pages/MenuPage";
import Offers from "./pages/admin/Offers";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFoundPage";
import RewardOrderTrackingPage from "./pages/user/RewardOrderTrackingPage";
import { SettingsProvider } from "./context/SettingContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import KitchenOrders from "./pages/kitchen/KitchenOrders";
import SocketProvider from "./components/socket/SocketProvider";
import AdminDashboard from "./pages/admin/Admin";
import { requestNotificationPermission } from "./utils/notifications";
import Support from "./pages/Support";
import ProfilePage from "./pages/ProfilePage";

// Settings Components
import SettingsLayout from "./features/settings/components/SettingsLayout";
import SystemSettings from "./features/settings/pages/SystemSettings";
import ServiceSettings from "./features/settings/pages/ServiceSettings";
import PaymentMethodsSettings from "./features/settings/pages/PaymentMethodsSettings";
import WebsiteDesignSettings from "./features/settings/pages/WebsiteDesignSettings";
import IntegrationsSettings from "./features/settings/pages/IntegrationsSettings";
import BrandingSettings from "./features/settings/pages/BrandingSettings";
import ContentSettings from "./features/settings/pages/ContentSettings";

 function App() {
  const { loadingGetMe, isAuthenticated } = useSelector((state) => state.auth);
  const [checked, setChecked] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(refreshToken());
        await dispatch(getMe());
      } catch (e) {
        // ignore errors
      } finally {
        setChecked(true);
      }
    };
  
    if (!checked) init();
  }, [dispatch, checked]);
  

  // Request notification permission on app load (centralized)
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (loadingGetMe) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SettingsProvider>
        <SocketProvider />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/rewards" element={<RewardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/reward-order/:id"
              element={<RewardOrderTrackingPage />}
            />

            {/* Customer Routes */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            <Route path="/support" element={<Support />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Order Listing and Tracking */}
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailsPage />} />
            
            {/* Cashier & Kitchen Dashboards */}
            <Route
              path="/cashier"
              element={
                <ProtectedRoute roles={["cashier", "admin"]}>
                  <CashierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute roles={["kitchen", "admin"]}>
                  <KitchenOrders />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard with nested routes */}
            <Route element={<AppLayout />}>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/offers"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <Offers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/kitchen"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <KitchenOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <Coupons />
                  </ProtectedRoute>
                }
              />
              
              {/* Settings Route - Main Settings Page */}
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <SettingsLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SystemSettings />} />
                <Route path="system" element={<SystemSettings />} />
                <Route path="services" element={<ServiceSettings />} />
                <Route path="payments" element={<PaymentMethodsSettings />} />
                <Route path="website" element={<WebsiteDesignSettings />} />
                <Route path="integrations" element={<IntegrationsSettings />} />
                <Route path="branding" element={<BrandingSettings />} />
                <Route path="content" element={<ContentSettings />} />
              </Route>
            </Route>
            
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            
            {/* Single Admin Page with section sub-route */}
            <Route element={<AppLayout />}>
              <Route
                path="/admin/:section?"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Layout>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;