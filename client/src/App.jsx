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
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import MenuPage from "./pages/MenuPage";
import { SettingsProvider } from "./context/SettingContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import CashierOrders from "./pages/admin/CashierOrders";
import KitchenOrders from "./pages/admin/KitchenOrders";
import SocketProvider from "./components/socket/SocketProvider";
import AdminDashboard from "./pages/admin/Admin";
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

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SettingsProvider>
        <SocketProvider />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/rewards" element={<RewardPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/verifyOtp" element={<VerifyOtpPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Customer Routes */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            
            {/* Order Listing and Tracking */}
            <Route path="/orders" element={<OrdersPage />} />


            {/* Cashier & Kitchen Dashboards */}
            <Route
              path="/cashier"
              element={
                <ProtectedRoute roles={["cashier", "admin"]}>
                  <CashierOrders />
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
              <Route
                path="/admin/:section"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Legacy routes redirects (removed) */}
          </Routes>
        </Layout>
      </SettingsProvider>
      <Chatbot />
    </BrowserRouter>
  );
};

export default App;
