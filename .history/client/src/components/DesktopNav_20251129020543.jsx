/* DesktopNav.jsx */
import { Home, Utensils, Clock4, Star, Gift, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DesktopNav() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden md:block fixed top-0 left-0 right-0 bg-background border-b z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex gap-6">
          <Link to="/" className={`flex items-center gap-2 ${isActive('/') ? 'text-primary' : 'text-muted'}`}>
            <Home size={20} />
            {t("home")}
          </Link>
          <Link to="/menu" className={`flex items-center gap-2 ${isActive('/menu') ? 'text-primary' : 'text-muted'}`}>
            <Utensils size={20} />
            {t("menu")}
          </Link>
          <Link to="/orders" className={`flex items-center gap-2 ${isActive('/orders') ? 'text-primary' : 'text-muted'}`}>
            <Clock4 size={20} />
            {t("orders")}
          </Link>
          <Link to="/reviews" className={`flex items-center gap-2 ${isActive('/reviews') ? 'text-primary' : 'text-muted'}`}>
            <Star size={20} />
            {t("reviews")}
          </Link>
          <Link to="/rewards" className={`flex items-center gap-2 ${isActive('/rewards') ? 'text-primary' : 'text-muted'}`}>
            <Gift size={20} />
            {t("rewards")}
          </Link>
        </div>

        <div className="flex gap-2 items-center">
          {i18n.language === "en" && (
            <button onClick={() => i18n.changeLanguage("ar")} className="px-2 py-1 border rounded">
              AR
            </button>
          )}
          {i18n.language === "ar" && (
            <button onClick={() => i18n.changeLanguage("en")} className="px-2 py-1 border rounded">
              EN
            </button>
          )}
          <button className="px-2 py-1">
            <Moon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}