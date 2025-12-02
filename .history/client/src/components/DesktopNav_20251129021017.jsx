/* DesktopNav.jsx */
import { Home, Utensils, Clock4, Star, Gift, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DesktopNav() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden md:block fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex gap-6">
          <Link to="/" className={`flex items-center gap-2 font-medium hover:text-blue-600 transition-colors ${isActive('/') ? 'text-blue-600' : 'text-gray-700'}`}>
            <Home size={20} />
            {t("home")}
          </Link>
          <Link to="/menu" className={`flex items-center gap-2 font-medium hover:text-blue-600 transition-colors ${isActive('/menu') ? 'text-blue-600' : 'text-gray-700'}`}>
            <Utensils size={20} />
            {t("menu")}
          </Link>
          <Link to="/orders" className={`flex items-center gap-2 font-medium hover:text-blue-600 transition-colors ${isActive('/orders') ? 'text-blue-600' : 'text-gray-700'}`}>
            <Clock4 size={20} />
            {t("orders")}
          </Link>
          <Link to="/reviews" className={`flex items-center gap-2 font-medium hover:text-blue-600 transition-colors ${isActive('/reviews') ? 'text-blue-600' : 'text-gray-700'}`}>
            <Star size={20} />
            {t("reviews")}
          </Link>
          <Link to="/rewards" className={`flex items-center gap-2 font-medium hover:text-blue-600 transition-colors ${isActive('/rewards') ? 'text-blue-600' : 'text-gray-700'}`}>
            <Gift size={20} />
            {t("rewards")}
          </Link>
        </div>

        <div className="flex gap-2 items-center">
          {i18n.language === "en" && (
            <button onClick={() => i18n.changeLanguage("ar")} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              AR
            </button>
          )}
          {i18n.language === "ar" && (
            <button onClick={() => i18n.changeLanguage("en")} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              EN
            </button>
          )}
          <button className="px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
            <Moon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}