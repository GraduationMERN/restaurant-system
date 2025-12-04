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

import CashierConfirmation from "./pages/CashierConfirmation";
import { SettingsProvider } from "./context/SettingContext";
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
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Payment Flow */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/cashier-confirmation" element={<CashierConfirmation />} />
          {/* Single Admin Page with section sub-route */}
          <Route element={<AppLayout />}>
            <Route path="/admin/:section?" element={<Admin />} />
          </Route>
        </Routes>
      </Layout>
      </SettingsProvider>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
