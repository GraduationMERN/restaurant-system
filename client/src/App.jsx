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
import OrderTracking from "./pages/orderTracking";
// New Payment Pages
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import MenuPage from "./pages/MenuPage";
import OrderHistory from "./pages/OrderHistory";

import NotFound from "./pages/NotFoundPage";
import CashierConfirmation from "./pages/CashierConfirmation";
import RewardOrderTrackingPage from "./pages/user/RewardOrderTrackingPage";
import { SettingsProvider } from "./context/SettingContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import CashierOrders from "./pages/admin/CashierOrders";
import KitchenOrders from "./pages/admin/KitchenOrders";
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
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/rewards" element={<RewardPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/verifyOtp" element={<VerifyOtpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrderTracking />} />
            <Route path="/orders/:orderId" element={<OrderTracking />} />
            <Route path="/track-order/:orderId" element={<OrderTracking />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/reward-order/:id" element={<RewardOrderTrackingPage />} />

          {/* Role dashboards */}
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

          {/* Payment Flow */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/cashier-confirmation" element={<CashierConfirmation />} />
          <Route path="/order-history" element={<OrderHistory />} />
          {/* Single Admin Page with section sub-route */}
          <Route element={<AppLayout />}>
            <Route path="/admin/:section?" element={<Admin />} />
          </Route>



          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </SettingsProvider>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
