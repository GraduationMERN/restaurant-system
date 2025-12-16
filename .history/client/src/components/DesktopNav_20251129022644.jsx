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

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl border-r border-gray-100 hidden md:block">
      <div className="flex flex-col h-full py-6 gap-1">
        {/* Language Switch */}
        <div className="flex justify-between items-center px-4 mb-4">
          {i18n.language === "en" && (
            <button
              onClick={() => i18n.changeLanguage("ar")}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg text-sm"
            >
              AR
            </button>
          )}
          {i18n.language === "ar" && (
            <button
              onClick={() => i18n.changeLanguage("en")}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg text-sm"
            >
              EN
            </button>
          )}

          {/* Dark mode toggle */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 text-gray-700 hover:text-blue-600">
            <Moon size={20} />
          </button>
        </div>

        {/* Navigation */}
        <Link
          to="/"
          className={`mx-3 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 font-medium ${
            isActive('/')
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <Home size={20} />
          <span className="text-sm">{t("home")}</span>
        </Link>

        <Link
          to="/menu"
          className={`mx-3 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 font-medium ${
            isActive('/menu')
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <Utensils size={20} />
          <span className="text-sm">{t("menu")}</span>
        </Link>

        <Link
          to="/orders"
          className={`mx-3 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 font-medium ${
            isActive('/orders')
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <Clock4 size={20} />
          <span className="text-sm">{t("orders")}</span>
        </Link>

        <Link
          to="/reviews"
          className={`mx-3 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 font-medium ${
            isActive('/reviews')
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <Star size={20} />
          <span className="text-sm">{t("reviews")}</span>
        </Link>

        <Link
          to="/rewards"
          className={`mx-3 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 font-medium ${
            isActive('/rewards')
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <Gift size={20} />
          <span className="text-sm">{t("rewards")}</span>
        </Link>

        <Link
          to="/login"
          className={`mx-3 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 font-medium ${
            isActive('/login')
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <LogInIcon size={20} />
          <span className="text-sm">{t("Login")}</span>
        </Link>
      </div>
    </aside>
  );
}