import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReviewsPage from "./pages/ReviewsPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./components/Layout";
import RewardPage from "./pages/RewardPage";
import Admin from "./pages/admin/Admin";
import AppLayout from "./layout/admin-layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import CartPage from "./pages/CartPage";

function App() {
  return (
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/rewards" element={<RewardPage />} />
            <Route path="/cart" element={<CartPage />} />
            {/* Single Admin Page with section sub-route */}
            <Route element={<AppLayout />}>
              <Route path="/admin/:section?" element={<Admin />} />
            </Route>
          </Routes>
        </Layout>
      </BrowserRouter>
  );
}

export default App;
