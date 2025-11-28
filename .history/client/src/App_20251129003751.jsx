import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ReviewsPage from "./pages/ReviewsPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./components/Layout";
import RewardPage from "./pages/RewardPage";
import OrderPage from "./features/order/ui/OrderPage"; 


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/rewards" element={<RewardPage />} />
          <Route path="/orders" element={<OrderPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
