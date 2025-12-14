import React, { useState, useEffect } from "react";
import { Gift, X } from "lucide-react";

export default function PointsModal({ isOpen, totalPoints, animatePoints }) {
  const [displayPoints, setDisplayPoints] = useState(0);

  // Animate points counter when totalPoints changes
  useEffect(() => {
    if (!isOpen) return;

    const targetPoints = totalPoints || 0;
    let currentPoints = 0;
    const increment = Math.ceil(targetPoints / 20); // Distribute over 20 steps

    const interval = setInterval(() => {
      currentPoints += increment;
      if (currentPoints >= targetPoints) {
        currentPoints = targetPoints;
        clearInterval(interval);
      }
      setDisplayPoints(currentPoints);
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen, totalPoints]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-fadeIn" />

      {/* Modal Container - Slide up animation */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:pb-6 animate-slideUp">
        <div className="max-w-md mx-auto bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl shadow-2xl border-2 border-amber-200 dark:border-amber-700 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-linear-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Gift className="w-8 h-8 animate-bounce" />
                  <div className="absolute inset-0 animate-ping rounded-full" />
                </div>
                <h3 className="text-2xl font-bold">Earn Points!</h3>
              </div>
            </div>
            <p className="text-amber-50 text-sm">You're getting closer to rewards</p>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Points Display with animation */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider mb-3">
                Reward Points
              </p>
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 animate-pulse">
                +{displayPoints.toLocaleString()}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 border border-amber-200 dark:border-amber-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Points will be added to your account after the order is confirmed.
              </p>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                ✨ Use them for exclusive discounts and rewards!
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
                <p className="text-2xl mb-1">🎁</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Earn & Save
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
                <p className="text-2xl mb-1">⚡</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Fast Rewards
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {}}
              className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-amber-600 dark:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Proceed to Checkout
            </button>
          </div>

          {/* Bottom accent */}
          <div className="h-1 bg-linear-to-r from-amber-400 via-orange-400 to-amber-400" />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-bounce {
          animation: bounce 1.2s infinite;
        }
      `}</style>
    </>
  );
}
