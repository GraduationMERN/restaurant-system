import { Home, Utensils, Clock4, Star, Gift } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  
  const location = useLocation();

  // Return true if route is active; caller toggles classes
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-full bg-white shadow-lg rounded-t-3xl fixed bottom-0 left-0 border-t border-gray-100">
      <div className="w-full max-w-xl mx-auto h-16 flex justify-around items-center px-4">
        {i18n.language === "en" && (
          <button 
            onClick={() => i18n.changeLanguage("ar")}
            className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-all duration-300"
          >
            <span className="text-xs font-semibold">AR</span>
          </button>
        )}
        {i18n.language === "ar" && (
          <button 
            onClick={() => i18n.changeLanguage("en")}
            className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-all duration-300"
          >
            <span className="text-xs font-semibold">EN</span>
          </button>
        )}
        
        <Link 
          to="/" 
          className={`flex flex-col items-center transition-all duration-300 ${
            isActive('/') 
              ? 'text-blue-600 scale-110' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Home size={22} />
          <span className="text-xs font-medium mt-1">{t("home")}</span>
        </Link>

        <Link 
          to="/menu" 
          className={`flex flex-col items-center transition-all duration-300 ${
            isActive('/menu') 
              ? 'text-blue-600 scale-110' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Utensils size={22} />
          <span className="text-xs font-medium mt-1">{t("menu")}</span>
        </Link>

        <Link 
          to="/orders" 
          className={`flex flex-col items-center transition-all duration-300 ${
            isActive('/orders') 
              ? 'text-blue-600 scale-110' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Clock4 size={22} />
          <span className="text-xs font-medium mt-1">{t("orders")}</span>
        </Link>

        <Link 
          to="/reviews" 
          className={`flex flex-col items-center transition-all duration-300 ${
            isActive('/reviews') 
              ? 'text-blue-600 scale-110' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Star size={22} />
          <span className="text-xs font-medium mt-1">{t("reviews")}</span>
        </Link>

        <Link 
          to="/rewards" 
          className={`flex flex-col items-center transition-all duration-300 ${
            isActive('/rewards') 
              ? 'text-blue-600 scale-110' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Gift size={22} />
          <span className="text-xs font-medium mt-1">{t("rewards")}</span>
        </Link>

      </div>
    </div>
  );
}