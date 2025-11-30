import {
  Home,
  Utensils,
  Clock4,
  Star,
  Gift,
  Moon,
  LogInIcon,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useSelector } from "react-redux";
import LogoutButton from "./ui/button/LogoutButton";

export default function CombinedNavbar() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ================= DESKTOP NAV (≥ md) ================= */}
      <aside
        className={`
          hidden md:block
          fixed left-0 top-0 h-full bg-surface shadow-sm transition-all duration-300
          ${isOpen ? "w-52" : "w-16"}
        `}
      >
        <div className="flex flex-col h-full py-4 gap-2">
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

            <button className="px-2 py-2 hover:bg-gray-100 rounded-md">
              <Moon size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <DesktopNavItem
            to="/"
            icon={<Home size={20} />}
            label={t("home")}
            active={isActive("/")}
            isOpen={isOpen}
          />

          <DesktopNavItem
            to="/menu"
            icon={<Utensils size={20} />}
            label={t("menu")}
            active={isActive("/menu")}
            isOpen={isOpen}
          />

          <DesktopNavItem
            to="/orders"
            icon={<Clock4 size={20} />}
            label={t("orders")}
            active={isActive("/orders")}
            isOpen={isOpen}
          />

          <DesktopNavItem
            to="/reviews"
            icon={<Star size={20} />}
            label={t("reviews")}
            active={isActive("/reviews")}
            isOpen={isOpen}
          />

          <DesktopNavItem
            to="/rewards"
            icon={<Gift size={20} />}
            label={t("rewards")}
            active={isActive("/rewards")}
            isOpen={isOpen}
          />
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            <DesktopNavItem
              to="/login"
              icon={<LogInIcon size={20} />}
              label={t("Login")}
              active={isActive("/login")}
              isOpen={isOpen}
            />
          )}
        </div>
      </aside>

      {/* ================= MOBILE NAV (sm only) ================= */}
      <div className="block md:hidden w-full bg-surface shadow-sm fixed bottom-0 left-0 z-50">
        <div className="w-full max-w-xl mx-auto h-14 flex justify-around items-center px-4">
          {/* Language */}
          {i18n.language == "en" && (
            <button onClick={() => i18n.changeLanguage("ar")}>AR</button>
          )}
          {i18n.language == "ar" && (
            <button onClick={() => i18n.changeLanguage("en")}>EN</button>
          )}

          <MobileNavItem
            to="/"
            icon={<Home size={20} />}
            label={t("home")}
            active={isActive("/")}
          />

          <MobileNavItem
            to="/menu"
            icon={<Utensils size={20} />}
            label={t("menu")}
            active={isActive("/menu")}
          />

          <MobileNavItem
            to="/orders"
            icon={<Clock4 size={20} />}
            label={t("orders")}
            active={isActive("/orders")}
          />

          <MobileNavItem
            to="/reviews"
            icon={<Star size={20} />}
            label={t("reviews")}
            active={isActive("/reviews")}
          />

          <MobileNavItem
            to="/rewards"
            icon={<Gift size={20} />}
            label={t("rewards")}
            active={isActive("/rewards")}
          />
        </div>
      </div>
    </>
  );
}

/* ------------ Desktop Nav Item ------------ */
function DesktopNavItem({ to, icon, label, active, isOpen }) {
  return (
    <Link
      to={to}
      className={`
        px-4 py-3 w-full flex items-center gap-3 hover:bg-gray-100 
        ${active ? "text-primary" : "text-muted"}
      `}
    >
      {icon}
      {isOpen && <span className="text-sm">{label}</span>}
    </Link>
  );
}

/* ------------ Mobile Nav Item ------------ */
function MobileNavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center ${
        active ? "text-primary" : "text-muted"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
