import {
  Home,
  Utensils,
  Clock4,
  Star,
  Gift,
  Moon,
  LogInIcon,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function DesktopNav() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Horizontal Navbar */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 pt-[10vh]">
        <div className="max-w-6xl mx-auto px-8">
          <div className="bg-white shadow-xl rounded-full border border-gray-100 px-8 py-4 flex items-center justify-center gap-8">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${
                isActive('/login')
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <LogInIcon size={20} />
              <span className="text-sm">{t("Login")}</span>
            </Link>

            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              {i18n.language === "en" && (
                <button
                  onClick={() => i18n.changeLanguage("ar")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg text-sm"
                >
                  AR
                </button>
              )}
              {i18n.language === "ar" && (
                <button
                  onClick={() => i18n.changeLanguage("en")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg text-sm"
                >
                  EN
                </button>
              )}

              <button className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 text-gray-700 hover:text-blue-600">
                <Moon size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Burger Menu */}
      <nav className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 bg-white rounded-full shadow-lg text-gray-700 hover:text-blue-600 transition-all duration-300"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-16 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 py-4 w-56">
            <div className="flex justify-center gap-2 px-4 mb-4 pb-4 border-b border-gray-100">
              {i18n.language === "en" && (
                <button
                  onClick={() => i18n.changeLanguage("ar")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md text-sm"
                >
                  AR
                </button>
              )}
              {i18n.language === "ar" && (
                <button
                  onClick={() => i18n.changeLanguage("en")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-md text-sm"
                >
                  EN
                </button>
              )}

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 text-gray-700 hover:text-blue-600">
                <Moon size={20} />
              </button>
            </div>

            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
        )}
      </nav>
    </>
  );
}