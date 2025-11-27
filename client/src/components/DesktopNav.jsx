import {
  Home,
  Utensils,
  Clock4,
  Star,
  Gift,
  Moon,
  LogInIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DesktopNav() {
  const { t, i18n } = useTranslation();

  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600"
      : "text-gray-500 hover:text-blue-600";

  return (
    <aside className="fixed left-0 top-0 h-full w-52 bg-white  shadow-sm">
      <div className="flex flex-col h-full py-4 gap-2">
        {/* Language Switch */}
        <div className="flex justify-between">
          {i18n.language === "en" && (
            <button
              onClick={() => i18n.changeLanguage("ar")}
              className="px-4 py-2 text-left  hover:bg-gray-100 "
            >
              AR
            </button>
          )}
          {i18n.language === "ar" && (
            <button
              onClick={() => i18n.changeLanguage("en")}
              className="px-4 py-2 text-left  hover:bg-gray-100 "
            >
              EN
            </button>
          )}

          {/* Dark mode toggle */}
          <button className="px-4 py-2 text-left   hover:bg-gray-100 ">
            <Moon size={20} />
          </button>
        </div>

        {/* Navigation */}
        <Link
          to="/"
          className={`px-4 py-2 w-full flex items-center gap-3 hover:bg-gray-100  ${isActive(
            "/"
          )}`}
        >
          <Home size={20} />
          <span className="text-sm">{t("home")}</span>
        </Link>

        <Link
          to="/menu"
          className={`px-4 py-2 w-full flex items-center gap-3 hover:bg-gray-100  ${isActive(
            "/menu"
          )}`}
        >
          <Utensils size={20} />
          <span className="text-sm">{t("menu")}</span>
        </Link>

        <Link
          to="/orders"
          className={`px-4 py-2 w-full flex items-center gap-3 hover:bg-gray-100  ${isActive(
            "/orders"
          )}`}
        >
          <Clock4 size={20} />
          <span className="text-sm">{t("orders")}</span>
        </Link>

        <Link
          to="/reviews"
          className={`px-4 py-2 w-full flex items-center gap-3 hover:bg-gray-100  ${isActive(
            "/reviews"
          )}`}
        >
          <Star size={20} />
          <span className="text-sm">{t("reviews")}</span>
        </Link>

        <Link
          to="/rewards"
          className={`px-4 py-2 w-full flex items-center gap-3 hover:bg-gray-100  ${isActive(
            "/rewards"
          )}`}
        >
          <Gift size={20} />
          <span className="text-sm">{t("rewards")}</span>
        </Link>
        <Link
          to="/login"
          className={`px-4 py-2 w-full flex items-center gap-3 hover:bg-gray-100  ${isActive(
            "/login"
          )}`}
        >
          <LogInIcon size={20} />
          <span className="text-sm">{t("Login")}</span>
        </Link>
      </div>
    </aside>
  );
}
