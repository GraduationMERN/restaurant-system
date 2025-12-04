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
} from "lucide-react";
import { ThemeToggleButton } from "./common/ThemeToggleButton";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useSelector } from "react-redux";
import LogoutButton from "./ui/button/LogoutButton";
import LoginButton from "./ui/button/LoginButton";

export default function CombinedNavbar() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const cartItem = useSelector(state => state.cart.products);
  const totalItems = cartItem.reduce((acc, item) => acc + item.quantity, 0);


  const isActive = (path) => location.pathname === path;

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

          {/* Language + Dark Mode */}
          <div className="flex justify-between items-center px-2">
            {isOpen && (
              <>
                {i18n.language === "en" && (
                  <button
                    onClick={() => i18n.changeLanguage("ar")}
                    className="px-2 py-2 hover:bg-gray-100 rounded-md"
                  >
                    AR
                  </button>
                )}

                {i18n.language === "ar" && (
                  <button
                    onClick={() => i18n.changeLanguage("en")}
                    className="px-2 py-2 hover:bg-gray-100 rounded-md"
                  >
                    EN
                  </button>
                )}
              </>
            )}

            <div className="">
              <ThemeToggleButton />
            </div>
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
            to="/cart"
            icon={<ShoppingCart size={20} />}
            label={t("cart")}
            active={isActive("/cart")}
            isOpen={isOpen}
            onClick={handleNavClick}
            badge={totalItems}
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
            icon={<Gift size={20} />}
            label={t("rewards")}
            active={isActive("/rewards")}
            isOpen={isOpen}
            onClick={handleNavClick}
          />
          {isAuthenticated ? (
            <LogoutButton isOpen={isOpen} />
          ) : (
            <LoginButton isOpen={isOpen} />
          )}
        </div>
      </aside>

      {/* MOBILE NAV (fixed bottom) */}
      <div className="block md:hidden w-full bg-surface shadow-sm fixed bottom-0 left-0 z-50">
        <div className="w-full h-14 flex justify-around items-center px-4">
          {/* Language toggles (mobile) */}
          {i18n.language === "en" && (
            <button onClick={() => i18n.changeLanguage("ar")}>AR</button>
          )}
          {i18n.language === "ar" && (
            <button onClick={() => i18n.changeLanguage("en")}>EN</button>
          )}

          {/* Theme toggle (mobile) */}
          <div className="flex items-center">
            <ThemeToggleButton />
          </div>

          <MobileNavItem
            to="/"
            icon={<Home size={20} />}
            label={t("home")}
            active={isActive("/")}
            onClick={handleNavClick}
          />

          <MobileNavItem
            to="/menu"
            icon={<Utensils size={20} />}
            label={t("menu")}
            active={isActive("/menu")}
            onClick={handleNavClick}
          />
          <MobileNavItem
            to="/cart"
            icon={<ShoppingCart size={20} />}
            label={t("cart")}
            active={isActive("/cart")}
            onClick={handleNavClick}
            badge={totalItems}
          />


          <MobileNavItem
            to="/orders"
            icon={<Clock4 size={20} />}
            label={t("orders")}
            active={isActive("/orders")}
            onClick={handleNavClick}
          />

          <MobileNavItem
            to="/reviews"
            icon={<Star size={20} />}
            label={t("reviews")}
            active={isActive("/reviews")}
            onClick={handleNavClick}
          />

          <MobileNavItem
            to="/rewards"
            icon={<Gift size={20} />}
            label={t("rewards")}
            active={isActive("/rewards")}
            onClick={handleNavClick}
          />
        </div>
      </div>
    </>
  );
}

/* ------------ Desktop Nav Item ------------ */
function DesktopNavItem({ to, icon, label, active, isOpen, onClick , badge}) {
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
      {isOpen && <span className="text-sm">{label}</span>}
    </Link>
  );
}

/* ------------ Mobile Nav Item ------------ */
function MobileNavItem({ to, icon, label, active, onClick,badge  }) {
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
