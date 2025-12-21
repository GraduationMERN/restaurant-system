// EmptyOrdersComponent.jsx - Clean Version
import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ChefHat, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EmptyOrdersComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const funnyMessages = t("orders.empty.messages", { returnObjects: true });

  const randomMessage =
    Array.isArray(funnyMessages) && funnyMessages.length > 0
      ? funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
      : t("orders.empty.description");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* Icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-md">
            <ShoppingBag className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("orders.empty.title")}
        </h2>

        {/* Funny Random Message */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 italic">
          {randomMessage}
        </p>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("orders.empty.description")}
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/menu")}
          className="inline-flex items-center gap-3 bg-primary text-white font-semibold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <ChefHat className="w-5 h-5" />
          {t("orders.empty.browse_menu")}
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Footer Tip */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("orders.empty.rewards_tip")}
          </p>
        </div>

      </div>
    </div>
  );
}
