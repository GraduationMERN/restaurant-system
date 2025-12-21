import { Home, Utensils, Clock4, Star, Gift, User, LogOut, HelpCircle, LayoutDashboard, ChefHat, CreditCard } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, logout } from "../redux/slices/authSlice";
import { fetchUserProfile } from "../redux/slices/userProfileSlice";
import { ThemeToggleButton } from "./common/ThemeToggleButton";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.userProfile || {});
  const cartItem = useSelector(state => state.cart.products);
  const totalItems = cartItem.reduce((acc, item) => acc + item.quantity, 0);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const avatarUrl = profile?.avatarUrl || user?.avatarUrl;
  const role = user?.role || "customer";

  const isActive = (path) => location.pathname === path;

  // Fetch user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !profile) {
      dispatch(fetchUserProfile());
    }
  }, [isAuthenticated, profile, dispatch]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      dispatch(logout());
      setDropdownOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Get role-specific dashboard link
  const getRoleLink = () => {
    switch (role) {
      case "admin":
        return { to: "/admin", label: t("nav.dashboard"), icon: <LayoutDashboard size={16} /> };
      case "kitchen":
        return { to: "/kitchen", label: t("nav.kitchen"), icon: <ChefHat size={16} /> };
      case "cashier":
        return { to: "/cashier", label: t("nav.cashier"), icon: <CreditCard size={16} /> };
      default:
        return null;
    }
  };

  const roleLink = getRoleLink();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full flex justify-between items-center">
      <div className="flex justify-between items-center">
      {/* Language Switch */}
      <button
        onClick={() => i18n.changeLanguage(i18n.language === "en" ? "ar" : "en")}
        className="flex flex-col items-center text-gray-600 mr-2 dark:text-gray-400 hover:text-primary transition-colors"
      >
        <span className="text-xs font-medium">{i18n.language === "en" ? "ع" : "En"}</span>
      </button>

      {/* Dark Mode Toggle */}
      <div className="flex flex-col items-center">
        <ThemeToggleButton />
      </div>
    </div>
      {/* Home */}
      <Link
        to="/"
        className={`flex flex-col items-center transition-colors ${isActive("/") ? "text-primary" : "text-gray-600 dark:text-gray-400 hover:text-primary"}`}
      >
        <Home size={20} />
        <span className="text-xs">{t("nav.home")}</span>
      </Link>

      {/* Menu */}
      <Link
        to="/menu"
        className={`flex flex-col items-center transition-colors ${isActive("/menu") ? "text-primary" : "text-gray-600 dark:text-gray-400 hover:text-primary"}`}
      >
        <Utensils size={20} />
        <span className="text-xs">{t("nav.menu")}</span>
      </Link>
   
      {/* Orders */}
      <Link
        to="/orders"
        className={`flex flex-col items-center transition-colors ${isActive("/orders") ? "text-primary" : "text-gray-600 dark:text-gray-400 hover:text-primary"}`}
      >
        <Clock4 size={20} />
        <span className="text-xs">{t("nav.orders")}</span>
      </Link>

      {/* Reviews */}
      {/* <Link
        to="/reviews"
        className={`flex flex-col items-center transition-colors ${isActive("/reviews") ? "text-primary" : "text-gray-600 dark:text-gray-400 hover:text-primary"}`}
      >
        <Star size={20} />
        <span className="text-xs">{t("reviews")}</span>
      </Link> */}

      {/* Rewards */}
      <Link
        to="/rewards"
        className={` group flex flex-col items-center transition-colors ${isActive("/rewards") ? "text-secondary" : "text-secondary/70 hover:text-secondary"}`}
      >
        <Gift size={20} />
        <span className="text-xs">{t("nav.rewards")}</span>
      </Link>

      {/* Support */}
      {/* <Link
        to="/support"
        className={`flex flex-col items-center transition-colors ${isActive("/support") ? "text-primary" : "text-gray-600 dark:text-gray-400 hover:text-primary"}`}
      >
        <HelpCircle size={20} />
        <span className="text-xs">{t("Support")}</span>
      </Link> */}



      {/* User Profile with Dropdown / Login */}
      {!isAuthenticated ? (
        <Link
          to="/login"
          className={`flex flex-col items-center transition-colors ${isActive("/login") ? "text-primary" : "text-gray-600 dark:text-gray-400 hover:text-primary"}`}
        >
          <User size={20} />
          <span className="text-xs">{t("nav.login")}</span>
        </Link>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex flex-col items-center"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover border-2 border-primary/40"
              />
            ) : (
              <User size={20} className="text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">{t("nav.me")}</span>
          </button>

          {/* Dropdown Menu - appears above the button */}
          {dropdownOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-[9999]">
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User size={16} />
                {t("nav.profile")}
              </Link>
              {roleLink && (
                <a
                  href={roleLink.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary/90"
                >
                  {roleLink.icon}
                  {roleLink.label}
                </a>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
              >
                <LogOut size={16} />
                {t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
