import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReviewsPage from "./pages/ReviewsPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./components/Layout";
import RewardPage from "./pages/RewardPage";
import Admin from "./pages/admin/Admin";
import AppLayout from "./layout/admin-layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RegistrationPage from "./pages/RegisterationPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { getMe } from "./redux/slices/authSlice";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import Chatbot from "./components/chatbot/Chatbot";
import OrdersPage from "./pages/orders/OrdersPage";
import OrderDetailsPage from "./pages/orders/OrderDetailsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import MenuPage from "./pages/MenuPage";

import NotFound from "./pages/NotFoundPage";
import RewardOrderTrackingPage from "./pages/user/RewardOrderTrackingPage";
import { SettingsProvider } from "./context/SettingContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import KitchenOrders from "./pages/admin/KitchenOrders";
import SocketProvider from "./components/socket/SocketProvider";
import AdminDashboard from "./pages/admin/Admin";
import { requestNotificationPermission } from './utils/notifications';
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Only try to auto-fetch the current user if we know
    // there was a previous authenticated session.
    if (typeof window !== "undefined") {
      const hasSession = window.localStorage.getItem("hasSession") === "true";
      if (hasSession) {
        dispatch(getMe());
      }
    }
  }, [dispatch]);

  // Request notification permission on app load (centralized)
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SettingsProvider>
        <SocketProvider />
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/rewards" element={<RewardPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/verifyOtp" element={<VerifyOtpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/reward-order/:id" element={<RewardOrderTrackingPage />} />

            {/* Customer Routes */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />

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
                path="/admin/kitchen"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <KitchenOrders />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            {/* Single Admin Page with section sub-route */}
            <Route element={<AppLayout />}>
              <Route path="/admin/:section?" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
            {/* Legacy routes redirects (removed) */}
          </Routes>
        </Layout>
      </SettingsProvider>
      <Chatbot />
    </BrowserRouter>
  );
};

export default App;
