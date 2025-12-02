import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Layout from "./components/Layout";

// Pages
import LandingPage from "./pages/LandingPage";
import ReviewsPage from "./pages/ReviewsPage";
import RewardPage from "./pages/RewardPage";
import OrderPage from "./features/order/ui/OrderPage"; // new

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/rewards" element={<RewardPage />} />
          <Route path="/orders" element={<OrderPage />} /> {/* new */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
