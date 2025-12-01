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

// New Payment Pages
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMe());
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/rewards" element={<RewardPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/verifyOtp" element={<VerifyOtpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Payment Flow */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />

          {/* Single Admin Page with section sub-route */}
          <Route element={<AppLayout />}>
            <Route path="/admin/:section?" element={<Admin />} />
          </Route>
        </Routes>
      </Layout>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
