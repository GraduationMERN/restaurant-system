import { useDispatch, useSelector } from "react-redux";
import { logoutUser, logout } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { ThemeToggleButton } from "./common/ThemeToggleButton";
import { useTranslation } from 'react-i18next';

export default function StaffNavbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth || {});
  const { t, i18n } = useTranslation();

  async function handleSignOut() {
    try {
      await dispatch(logoutUser());
      dispatch(logout());
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex items-center justify-between w-full px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {user?.role === 'cashier' ? 'Cashier Dashboard' : 'Kitchen Dashboard'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.name || 'Staff'}
          </span>
          {/* Language Switch */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "ar" : "en")}
            className="flex flex-col items-center text-gray-600 mr-2 dark:text-gray-400 hover:text-primary transition-colors"
          >
            <span className="text-xs font-medium">{i18n.language === "en" ? "ع" : "En"}</span>
          </button>

          {/* Dark Mode Toggle */}
          <div className="flex flex-col items-center">
            <ThemeToggleButton />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}