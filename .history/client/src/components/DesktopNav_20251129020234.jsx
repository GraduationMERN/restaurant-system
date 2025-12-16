/* DesktopNav.jsx */
import { Home, Utensils, Clock4, Star, Gift, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DesktopNav() {
const { t, i18n } = useTranslation();
const location = useLocation();

const isActive = (path) => location.pathname === path;

return (



<Link to="/" className={flex items-center gap-2 ${isActive('/') ? 'text-primary' : 'text-muted'}}>

{t("home")}

<Link to="/menu" className={flex items-center gap-2 ${isActive('/menu') ? 'text-primary' : 'text-muted'}}>

{t("menu")}

<Link to="/orders" className={flex items-center gap-2 ${isActive('/orders') ? 'text-primary' : 'text-muted'}}>

{t("orders")}

<Link to="/reviews" className={flex items-center gap-2 ${isActive('/reviews') ? 'text-primary' : 'text-muted'}}>

{t("reviews")}

<Link to="/rewards" className={flex items-center gap-2 ${isActive('/rewards') ? 'text-primary' : 'text-muted'}}>

{t("rewards")}




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