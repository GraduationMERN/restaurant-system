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
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getMe } from "./redux/slices/authSlice";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import CartPage from "./pages/CartPage";
import Chatbot from "./components/chatbot/Chatbot";
import LoadingSpinner from "./components/LoadingSpinner";
import GoogleSuccess from "./components/GoogleSuccess";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const { loadingGetMe } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMe());
  }, []);

  if (loadingGetMe) {
    return <LoadingSpinner />;
  }

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
          <Route path="/auth/google/success" element={<GoogleSuccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/cart" element={<CartPage />} />
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
