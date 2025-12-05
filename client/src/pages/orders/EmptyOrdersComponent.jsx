// EmptyOrdersComponent.jsx - Empty State for Orders
import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ChefHat, Sparkles } from "lucide-react";

export default function EmptyOrdersComponent() {
  const navigate = useNavigate();

  const funnyMessages = [
    "🍕 Your cart is as empty as our delivery guys' gas tanks!",
    "🍔 No orders yet? Let's fix that hunger situation!",
    "🍜 Your taste buds are waiting for an adventure!",
    "🥗 Breaking: Local restaurant still has no orders from you",
    "🍱 It's pizza o'clock and you're not participating?",
    "🌮 Your stomach is staging a protest!",
    "🍰 Life is short, eat dessert first... we have it!",
    "☕ Even our coffee is lonely without your orders!",
  ];

  const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-lg">
            <ShoppingBag className="w-12 h-12 text-orange-500 dark:text-orange-400" />
          </div>
        </div>

        {/* Main Message */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          No Orders Yet
        </h2>

        {/* Funny Message */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 italic">
          {randomMessage}
        </p>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          When you place an order, you'll be able to track it in real-time right here. Let's get started!
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/menu")}
          className="inline-flex items-center gap-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
        >
          <ChefHat className="w-5 h-5" />
          Browse Menu
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Secondary Info */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            💡 Pro Tip: Join our rewards program and get 10% off your first order!
          </p>
        </div>
      </div>
    </div>
  );
}
