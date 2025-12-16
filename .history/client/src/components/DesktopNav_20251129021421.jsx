/* DesktopNav.jsx */
import { Home, Utensils, Clock4, Star, Gift, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DesktopNav() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden md:block fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg z-50">
      <div className="max-w-5xl mx-auto px-8 h-20 flex justify-center items-center mt-[10vh]">
        <div className="flex gap-8 items-center bg-white px-8 py-3 rounded-full shadow-xl border border-gray-100">
          <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 ${isActive('/') ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <Home size={20} />
            {t("home")}
          </Link>
          <Link to="/menu" className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 ${isActive('/menu') ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <Utensils size={20} />
            {t("menu")}
          </Link>
          <Link to="/orders" className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 ${isActive('/orders') ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <Clock4 size={20} />
            {t("orders")}
          </Link>
          <Link to="/reviews" className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 ${isActive('/reviews') ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <Star size={20} />
            {t("reviews")}
          </Link>
          <Link to="/rewards" className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 ${isActive('/rewards') ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <Gift size={20} />
            {t("rewards")}
          </Link>
        </div>
        </div>

        <div className="flex gap-3 items-center ml-8">
          {i18n.language === "en" && (
            <button onClick={() => i18n.changeLanguage("ar")} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
              AR
            </button>
          )}
          {i18n.language === "ar" && (
            <button onClick={() => i18n.changeLanguage("en")} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
              EN
            </button>
          )}
          <button className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-300 text-gray-700 hover:text-blue-600 hover:scale-110">
            <Moon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}