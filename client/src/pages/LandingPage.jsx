import React from "react";
import {
  Utensils,
  Clock,
  ArrowRight,
  ChefHat,
  MapPin,
  Phone,
  LifeBuoy,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingContext";
import LocationMap from "../components/home/LocationMap";

export default function LandingPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center px-4 py-8 ${isRTL ? "rtl" : "ltr"
        }`}
    >
      <div className="max-w-7xl w-full">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-800">
            <img
              src={
                settings.branding?.logoUrl ||
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=256&h=256&fit=crop"
              }
              alt={t("welcome")}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {settings.restaurantName || t("welcome")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {settings.description}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate("/menu")}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group text-left"
          >
            <div
              className={`flex items-start justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Utensils className="w-8 h-8 text-secondary dark:text-orange-400" />
              </div>
              <ArrowRight
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-secondary dark:group-hover:text-orange-400 transition-colors ${isRTL ? "rotate-180" : ""
                  }`}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t("browse_menu")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("explore_dishes")}
            </p>
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group text-left"
          >
            <div
              className={`flex items-start justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <ArrowRight
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors ${isRTL ? "rotate-180" : ""
                  }`}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t("track_order")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("check_status")}
            </p>
          </button>
          <button
            onClick={() => navigate("/reviews")}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group text-left"
          >
            <div
              className={`flex items-start justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <div className="w-16 h-16 bg-primary/10 dark:bg-orange-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8 text-primary dark:text-orange-400" />
              </div>
              <ArrowRight
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-secondary dark:group-hover:text-orange-400 transition-colors ${isRTL ? "rotate-180" : ""
                  }`}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t("reviews")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("explore_reviews")}
            </p>
          </button>

          <button
            onClick={() => navigate("/support")}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group text-left"
          >
            <div
              className={`flex items-start justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LifeBuoy className="w-8 h-8 text-secondary dark:text-orange-400" />
              </div>
              <ArrowRight
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-secondary dark:group-hover:text-orange-400 transition-colors ${isRTL ? "rotate-180" : ""
                  }`}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t("Support")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("FAQ_and_help")}
            </p>
          </button>
        </div>

        {/* Special Offer Card */}
        <div className="bg-primary to-primary rounded-2xl p-8 shadow-xl text-white mb-8">
          <div
            className={`flex items-center justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""
              }`}
          >
            <ChefHat className="w-12 h-12" />
            <div className={`text-right ${isRTL ? "text-left" : ""}`}>
              <span className="text-3xl font-bold">20%</span>
              <span className="text-lg font-medium ml-1">
                {t("off", "OFF")}
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-3">{t("special_offer")}</h3>
          <p className="text-secondary mb-6 opacity-90">
            {t("Special Rewards for Customers")}
          </p>
          <button
            onClick={() => navigate("/register")}
            className="w-full bg-white text-secondary font-semibold py-4 px-6 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all duration-300 transform hover:scale-[1.02]"
          >
            {t("Register_rewards")}
          </button>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t("location")}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {settings.address}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t("call_us")}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {settings.phone}
                </p>
              </div>
            </div>
          </div>
          <LocationMap />
        </div>
      </div>
    </div>
  );
}
