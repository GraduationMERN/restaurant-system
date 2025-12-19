import {
  Home,
  Utensils,
  Clock4,
  Star,
  Gift,
  LogInIcon,
  Menu,
  X,
  ShoppingCart,
  User,
  LifeBuoy,
  HelpCircle,
  ChevronDown,
  ChefHat,
  LayoutDashboard,
  CreditCard,
  LogOut,
} from "lucide-react";
import { ThemeToggleButton } from "./common/ThemeToggleButton";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, logout } from "../redux/slices/authSlice";
import LoginButton from "./ui/button/LoginButton";
import { useRole } from "../hooks/useRole";

export default function CombinedNavbar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const { isAdmin } = useRole();

  // Close sidebar when clicking a nav item (useful on mobile)
  const handleNavClick = () => setIsOpen(false);

  return (
    <>
      {/* BACKDROP (only visible on md and up when sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 hidden md:block "
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`
          hidden md:block
          fixed left-0 top-0 h-full bg-surface shadow-sm transition-all duration-300 z-50 
          ${isOpen ? "w-52" : "w-16"}
        `}
        onClick={(e) => e.stopPropagation()} // prevent backdrop clicks from bubbling inside
      >
        <div className="flex flex-col h-full py-4 gap-2 dark:bg-black">
          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 hover:bg-gray-100 flex items-center"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Language + Dark Mode - Side by Side */}
          <div className="flex items-center justify-center gap-1 px-2">
            {/* Language Button */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === "en" ? "ar" : "en")}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
              title={i18n.language === "en" ? "Switch to Arabic" : "Switch to English"}
            >
              {i18n.language === "en" ? "ع" : "En"}
            </button>
            
            {/* Dark Mode Toggle */}
            <ThemeToggleButton />
          </div>

          {/* Navigation Items */}
          <DesktopNavItem
            to="/"
            icon={<Home size={20} />}
            label={t("home")}
            active={isActive("/")}
            isOpen={isOpen}
            onClick={handleNavClick}
          />

          <DesktopNavItem
            to="/menu"
            icon={<Utensils size={20} />}
            label={t("menu")}
            active={isActive("/menu")}
            isOpen={isOpen}
            onClick={handleNavClick}
          />

          <DesktopNavItem
            to="/orders"
            icon={<Clock4 size={20} />}
            label={t("orders")}
            active={isActive("/orders")}
            isOpen={isOpen}
            onClick={handleNavClick}
          />

          <DesktopNavItem
            to="/reviews"
            icon={<Star size={20} />}
            label={t("reviews")}
            active={isActive("/reviews")}
            isOpen={isOpen}
            onClick={handleNavClick}
          />

          <DesktopNavItem
            to="/rewards"
            icon={<Gift size={20} className="text-secondary" />}
            label={t("rewards")}
            active={isActive("/rewards")}
            isOpen={isOpen}
            onClick={handleNavClick}
          />
          <DesktopNavItem
            to="/support"
            icon={<HelpCircle size={20} />}
            label={"Support"}
            active={isActive("/support")}
            isOpen={isOpen}
            onClick={handleNavClick}
          />
          
          {/* Spacer to push user section to bottom */}
          <div className="flex-1" />
          
          {/* User Profile Section */}
          {isAuthenticated && user ? (
            <UserDropdown isOpen={isOpen} user={user} onNavClick={handleNavClick} />
          ) : (
            <LoginButton isOpen={isOpen} />
          )}
        </div>
      </aside>

      {/* MOBILE NAV (fixed bottom) */}
      <div className="block md:hidden w-full bg-surface shadow-lg fixed bottom-0 left-0 z-50 border-t border-gray-200 dark:border-gray-700 dark:bg-gray-900">
        <div className="w-full h-16 flex justify-around items-center px-2">
          {/* Home */}
          <MobileNavItem
            to="/"
            icon={<Home size={20} />}
            label={t("home")}
            active={isActive("/")}
            onClick={handleNavClick}
          />

          {/* Menu */}
          <MobileNavItem
            to="/menu"
            icon={<Utensils size={20} />}
            label={t("menu")}
            active={isActive("/menu")}
            onClick={handleNavClick}
          />

          {/* Orders */}
          <MobileNavItem
            to="/orders"
            icon={<Clock4 size={20} />}
            label={t("orders")}
            active={isActive("/orders")}
            onClick={handleNavClick}
          />

          {/* Support */}
          <MobileNavItem
            to="/support"
            icon={<HelpCircle size={20} />}
            label={"Support"}
            active={isActive("/support")}
            onClick={handleNavClick}
          />

          {/* Theme Toggle */}
          <div className="flex flex-col items-center">
            <ThemeToggleButton />
          </div>

          {/* User Dropdown / Login */}
          {isAuthenticated && user ? (
            <MobileUserDropdown user={user} onNavClick={handleNavClick} />
          ) : (
            <MobileNavItem
              to="/login"
              icon={<User size={20} />}
              label={t("login")}
              active={isActive("/login")}
              onClick={handleNavClick}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ------------ Desktop Nav Item ------------ */
function DesktopNavItem({ to, icon, label, active, isOpen, onClick, badge }) {
  // Note: onClick used to optionally close sidebar or perform other actions
  return (
    <Link
      to={to}
      onClick={() => onClick && onClick()}
      className={`
        px-4 py-3 w-full flex items-center gap-3 hover:bg-gray-100 
        ${active ? "text-primary" : "text-muted"}
      `}
    >
      <div className="relative">
        {icon}
        {/* Badge */}
        {badge > 0 && (
          <span
            className="absolute -top-2 -right-2 text-white text-[10px] font-bold flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "50%",
              height: "18px",
              minWidth: "18px",
              padding: "0 4px",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {isOpen && (
        <span
          className={`text-sm ${label === "Rewards" ? "text-secondary" : ""}`}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

/* ------------ Mobile Nav Item ------------ */
function MobileNavItem({ to, icon, label, active, onClick, badge }) {
  return (
    <Link
      to={to}
      onClick={() => onClick && onClick()}
      className={`flex flex-col items-center ${
        active ? "text-primary" : "text-muted"
      }`}
    >
      <div className="relative">
        {icon}
        {/* Badge */}
        {badge > 0 && (
          <span
            className="absolute -top-2 -right-3 text-white text-[10px] font-bold flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "50%",
              height: "16px",
              minWidth: "16px",
              padding: "0 4px",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <span className="text-xs">{label}</span>
    </Link>
  );
}

/* ------------ User Dropdown ------------ */
function UserDropdown({ isOpen, user, onNavClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { profile } = useSelector((state) => state.userProfile || {});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl;
  const role = user?.role || "customer";

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

  const getRoleLink = () => {
    switch (role) {
      case "admin":
        return { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> };
      case "kitchen":
        return { to: "/kitchen", label: "Kitchen", icon: <ChefHat size={16} /> };
      case "cashier":
        return { to: "/cashier", label: "Cashier", icon: <CreditCard size={16} /> };
      default:
        return null;
    }
  };

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

  const roleLink = getRoleLink();

  return (
    <div className="relative px-2" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          isOpen ? "justify-start" : "justify-center"
        }`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover border-2 border-primary/30"
          />
        ) : (
          <User size={20} className="w-8 h-8 rounded-full object-cover border-2 border-primary/30" />
        )}
        {isOpen && (
          <>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[120px]">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
            </div>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className={`absolute ${isOpen ? "left-2 right-2" : "left-0"} bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[160px]`}>
          <Link
            to="/profile"
            onClick={() => { setDropdownOpen(false); onNavClick && onNavClick(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <User size={16} />
            Profile
          </Link>
          {roleLink && (
            <a
              href={roleLink.to}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { setDropdownOpen(false); onNavClick && onNavClick(); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {roleLink.icon}
              {roleLink.label}
            </a>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------ Mobile User Dropdown ------------ */
function MobileUserDropdown({ user, onNavClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { profile } = useSelector((state) => state.userProfile || {});

  const avatarUrl = profile?.avatarUrl || user?.avatarUrl || "/images/user/owner.jpg";
  const role = user?.role || "customer";

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

  const getRoleLink = () => {
    switch (role) {
      case "admin":
        return { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> };
      case "kitchen":
        return { to: "/kitchen", label: "Kitchen", icon: <ChefHat size={16} /> };
      case "cashier":
        return { to: "/cashier", label: "Cashier", icon: <CreditCard size={16} /> };
      default:
        return null;
    }
  };

  const roleLink = getRoleLink();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex flex-col items-center"
      >
        <img
          src={avatarUrl}
          alt="User"
          className="w-7 h-7 rounded-full object-cover border-2 border-primary/40"
        />
        <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Me</span>
      </button>

      {/* Dropdown Menu - appears above the button */}
      {dropdownOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <Link
            to="/profile"
            onClick={() => { setDropdownOpen(false); onNavClick && onNavClick(); }}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <User size={16} />
            Profile
          </Link>
          <Link
            to="/reviews"
            onClick={() => { setDropdownOpen(false); onNavClick && onNavClick(); }}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Star size={16} />
            Reviews
          </Link>
          <Link
            to="/rewards"
            onClick={() => { setDropdownOpen(false); onNavClick && onNavClick(); }}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Gift size={16} className="text-secondary" />
            Rewards
          </Link>
          {roleLink && (
            <Link
              to={roleLink.to}
              onClick={() => { setDropdownOpen(false); onNavClick && onNavClick(); }}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-white bg-primary hover:bg-primary/90"
            >
              {roleLink.icon}
              {roleLink.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
