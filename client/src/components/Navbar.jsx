import { Home, Utensils, Clock4, Star, Gift, ShoppingCart, User, LogOut, HelpCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice"; // adjust path

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector(state => state.auth);
  const cartItem = useSelector(state => state.cart.products);
  const totalItems = cartItem.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/menu");
  };

  return (
    <div className="w-full flex justify-between items-center">

      {/* Language Switch */}
      {i18n.language === "en" ? (
        <button
          onClick={() => i18n.changeLanguage("ar")}
          className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
        >
          <span className="text-xs font-medium">AR</span>
        </button>
      ) : (
        <button
          onClick={() => i18n.changeLanguage("en")}
          className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
        >
          <span className="text-xs font-medium">EN</span>
        </button>
      )}

      {/* Normal Navbar Buttons */}
      {/* Home */}
      <Link
        to="/"
        className={`flex flex-col items-center transition-colors ${isActive("/") ? "text-primary" : "text-gray-600 hover:text-primary"}`}
      >
        <Home size={20} />
        <span className="text-xs">{t("home")}</span>
      </Link>

      {/* Menu */}
      <Link
        to="/menu"
        className={`flex flex-col items-center transition-colors ${isActive("/menu") ? "text-primary" : "text-gray-600 hover:text-primary"}`}
      >
        <Utensils size={20} />
        <span className="text-xs">{t("menu")}</span>
      </Link>
   
      {/* Orders */}
      <Link
        to="/orders"
        className={`flex flex-col items-center transition-colors ${isActive("orders/:id") ? "text-primary" : "text-gray-600 hover:text-primary"}`}
      >
        <Clock4 size={20} />
        <span className="text-xs">{t("orders")}</span>
      </Link>


      {/* Rewards */}
      <Link
        to="/rewards"
        className={`flex flex-col items-center transition-colors text-secondary/60 ${isActive("/rewards") ? "text-secondary" : "text-gray-600 hover:text-secondary"}`}
      >
        <Gift size={20} />
        <span className="text-xs">{t("rewards")}</span>
      </Link>

      {/* LOGIN / LOGOUT */}
      {!isAuthenticated ? (
        <Link
          to="/login"
          className={`flex flex-col items-center transition-colors ${isActive("/login") ? "text-primary" : "text-gray-600 hover:text-primary"
            }`}
        >
          <User size={20} />
          <span className="text-xs">{t("login")}</span>
        </Link>
      ) : (
        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-xs">{t("logout")}</span>
        </button>
      )}

    </div>
  );
}
