import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ReviewsPage from "./pages/ReviewsPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./components/Layout";
import RewardPage from "./pages/RewardPage";
import Admin from "./pages/admin/Admin";
import Coupons from "./pages/admin/Coupons";
import AppLayout from "./layout/admin-layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RegistrationPage from "./pages/RegisterationPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { getMe, refreshToken } from "./redux/slices/authSlice";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoadingSpinner from "./components/LoadingSpinner";
import GoogleSuccess from "./components/GoogleSuccess";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import OrdersPage from "./pages/orders/OrdersPage";
import OrderDetailsPage from "./pages/orders/OrderDetailsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import MenuPage from "./pages/MenuPage";

import NotFound from "./pages/NotFoundPage";
import RewardOrderTrackingPage from "./pages/user/RewardOrderTrackingPage";
import { SettingsProvider } from "./context/SettingContext";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import KitchenOrders from "./pages/admin/KitchenOrders";
import SocketProvider from "./components/socket/SocketProvider";
import AdminDashboard from "./pages/admin/Admin";
import { requestNotificationPermission } from "./utils/notifications";
import Support from "./pages/Support";
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
  // Only try to auto-fetch the current user if we know
  // there was a previous authenticated session.

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
            <Route path="/auth/google/success" element={<GoogleSuccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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

            {/* Order Listing and Tracking */}
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailsPage />} />
            {/* Cashier & Kitchen Dashboards */}
            <Route
              path="/cashier"
              element={
                  <CashierDashboard />
              }
            />
            <Route
              path="/kitchen"
              element={
                  <KitchenOrders />
              }
            />

            {/* Admin Dashboard with nested routes */}
            <Route element={<AppLayout />}>
              <Route
                path="/admin"
                element={
                    <AdminDashboard />
                }
              />
              <Route
                path="/admin/kitchen"
                element={
                    <KitchenOrders />
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
            </Route>
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            {/* Single Admin Page with section sub-route */}
            <Route element={<AppLayout />}>
              <Route
                path="/admin/:section?"
                element={
                    <Admin />
                }
              />
            </Route>
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
            {/* Legacy routes redirects (removed) */}
          </Routes>
        </Layout>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
