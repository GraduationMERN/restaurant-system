import { Home, Utensils, Clock4 , Star, Gift } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600"
      : "text-gray-500 hover:text-blue-600";

  return (
    <div className="w-full bg-white  shadow-sm fixed bottom-0 left-0 ">
      <div className="w-full max-w-xl mx-auto h-14 flex justify-around items-center px-4">

        <Link to="/" className={`flex flex-col items-center ${isActive("/")}`}>
          <Home size={20} />
          <span className="text-xs">Home</span>
        </Link>

        <Link to="/menu" className={`flex flex-col items-center ${isActive("/menu")}`}>
          <Utensils size={20} />
          <span className="text-xs">Menu</span>
        </Link>

        <Link to="/orders" className={`flex flex-col items-center ${isActive("/orders")}`}>
          <Clock4  size={20} />
          <span className="text-xs">Orders</span>
        </Link>

        <Link to="/reviews" className={`flex flex-col items-center ${isActive("/reviews")}`}>
          <Star size={20} />
          <span className="text-xs">Reviews</span>
        </Link>

        <Link to="/rewards" className={`flex flex-col items-center ${isActive("/rewards")}`}>
          <Gift size={20} />
          <span className="text-xs">Rewards</span>
        </Link>

      </div>
    </div>
  );
}
