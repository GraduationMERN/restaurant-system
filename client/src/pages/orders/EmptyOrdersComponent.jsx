// EmptyOrdersComponent.jsx - Clean Version
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

  const randomMessage =
    funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

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
          No Orders Yet
        </h2>

        {/* Funny Random Message */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 italic">
          {randomMessage}
        </p>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Place your first order and track it in real time. Let's get started!
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/menu")}
          className="inline-flex items-center gap-3 bg-primary text-white font-semibold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <ChefHat className="w-5 h-5" />
          Browse Menu
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Footer Tip */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 Join our rewards program and get **10% off** your first order!
          </p>
        </div>

      </div>
    </div>
  );
}
