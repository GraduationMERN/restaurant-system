import { Home, Utensils, Clock4 , Star, Gift } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  
  const location = useLocation();

  // Return true if route is active; caller toggles classes
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-full bg-surface shadow-sm fixed bottom-0 left-0">
      <div className="w-full max-w-xl mx-auto h-14 flex justify-around items-center px-4">
        {i18n.language=="en"&&<button onClick={() => i18n.changeLanguage("ar")}>AR</button>}
        {i18n.language=="ar"&&<button onClick={() => i18n.changeLanguage("en")}>EN</button>}
        <Link to="/" className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-muted'}`}>
          <Home size={20} />
          <span className="text-xs">{t("home")}</span>
        </Link>

        <Link to="/menu" className={`flex flex-col items-center ${isActive('/menu') ? 'text-primary' : 'text-muted'}`}>
          <Utensils size={20} />
          <span className="text-xs">{t("menu")}</span>
        </Link>

        <Link to="/orders" className={`flex flex-col items-center ${isActive('/orders') ? 'text-primary' : 'text-muted'}`}>
          <Clock4  size={20} />
          <span className="text-xs">{t("orders")}</span>
        </Link>

        <Link to="/reviews" className={`flex flex-col items-center ${isActive('/reviews') ? 'text-primary' : 'text-muted'}`}>
          <Star size={20} />
          <span className="text-xs">{t("reviews")}</span>
        </Link>

        <Link to="/rewards" className={`flex flex-col items-center ${isActive('/rewards') ? 'text-primary' : 'text-muted'}`}>
          <Gift size={20} />
          <span className="text-xs">{t("rewards")}</span>
        </Link>

      </div>
    </div>
  );
}
