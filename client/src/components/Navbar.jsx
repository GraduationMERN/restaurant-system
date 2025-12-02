import { Home, Utensils, Clock4, Star, Gift,ShoppingCart  } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-full flex justify-between items-center">
      {i18n.language === "en" && (
        <button 
          onClick={() => i18n.changeLanguage("ar")}
          className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <span className="text-xs font-medium">AR</span>
        </button>
      )}
      {i18n.language === "ar" && (
        <button 
          onClick={() => i18n.changeLanguage("en")}
          className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <span className="text-xs font-medium">EN</span>
        </button>
      )}

      <Link 
        to="/" 
        className={`flex flex-col items-center transition-colors ${
          isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        <Home size={20} />
        <span className="text-xs">{t("home")}</span>
      </Link>

      <Link 
        to="/menu" 
        className={`flex flex-col items-center transition-colors ${
          isActive('/menu') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        <Utensils size={20} />
        <span className="text-xs">{t("menu")}</span>
      </Link>

      <Link 
        to="/cart" 
        className={`flex flex-col items-center transition-colors ${
          isActive('/cart') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        <ShoppingCart  size={20} />
        <span className="text-xs">{t("menu")}</span>
      </Link>

      <Link 
        to="/orders" 
        className={`flex flex-col items-center transition-colors ${
          isActive('/orders') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        <Clock4 size={20} />
        <span className="text-xs">{t("orders")}</span>
      </Link>

      <Link 
        to="/reviews" 
        className={`flex flex-col items-center transition-colors ${
          isActive('/reviews') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        <Star size={20} />
        <span className="text-xs">{t("reviews")}</span>
      </Link>

      <Link 
        to="/rewards" 
        className={`flex flex-col items-center transition-colors ${
          isActive('/rewards') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        <Gift size={20} />
        <span className="text-xs">{t("rewards")}</span>
      </Link>
    </div>
  );
}