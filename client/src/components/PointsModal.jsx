import React, { useState, useEffect } from "react";
import { Gift, Zap, Lightbulb, Award, Wallet, TrendingUp } from "lucide-react";

export default function PointsModal({ totalPoints = 0 }) {
  const [displayPoints, setDisplayPoints] = useState(0);
  const [prevPoints, setPrevPoints] = useState(0);

  // Animate points counter
  useEffect(() => {
    if (totalPoints > prevPoints) {
      let current = displayPoints;
      const diff = totalPoints - displayPoints;
      const increment = Math.ceil(diff / 20);

      const interval = setInterval(() => {
        current += increment;
        if (current >= totalPoints) {
          current = totalPoints;
          clearInterval(interval);
        }
        setDisplayPoints(current);
      }, 25);

      setPrevPoints(totalPoints);
      return () => clearInterval(interval);
    } else if (totalPoints !== displayPoints) {
      setDisplayPoints(totalPoints);
      setPrevPoints(totalPoints);
    }
  }, [totalPoints, displayPoints, prevPoints]);

  return (
    <div className="w-full bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 dark:border-gray-700 p-6 md:p-8 transition-all duration-500 animate-fadeInScale">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 to-pink-400/30 rounded-full animate-pulse-slow blur-xl" />
          <Gift className="w-8 h-8 text-yellow-400 relative z-10 animate-bounce-slow" />
        </div>
        <div>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Reward Points</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Earned from this order</p>
        </div>
      </div>

      {/* Points Display */}
      <div className="mb-6 p-6 bg-gradient-to-tr from-yellow-50/50 to-pink-50/30 dark:from-gray-800/50 dark:to-gray-700/30 rounded-2xl border border-yellow-200/30 dark:border-gray-600 flex flex-col items-center">
        <div className="flex items-center gap-2 text-sm uppercase font-semibold text-gray-600 dark:text-gray-400">
          Total Points
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500 mt-2 animate-countUp">
          {displayPoints.toLocaleString()}
        </div>
        <div className="absolute w-32 h-32 bg-yellow-300/20 rounded-full -top-10 right-2 blur-2xl animate-pulse-slow" />
      </div>

      {/* Tip Box */}
      <div className="bg-yellow-50/40 dark:bg-gray-800/30 rounded-2xl p-3 mb-6 border border-yellow-200/40 dark:border-gray-600 flex items-start gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Tip:</span> Earn <span className="font-bold text-yellow-400">2 points</span> for every <span className="font-bold">$1</span> spent. Redeem them for exclusive rewards!
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[{icon: Award, label: "Earn"}, {icon: Wallet, label: "Save"}, {icon: TrendingUp, label: "Rewards"}].map((item, i) => (
          <div key={i} className="bg-white/20 dark:bg-gray-800/40 rounded-xl p-4 text-center border border-white/20 dark:border-gray-700 hover:scale-105 transition-transform duration-300 shadow hover:shadow-lg">
            <item.icon className="w-6 h-6 text-yellow-400 mb-2 mx-auto animate-float" />
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-200">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInScale { animation: fadeInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes bounce-slow { 0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);} }
        .animate-bounce-slow { animation: bounce-slow 1.5s infinite; }

        @keyframes pulse-slow { 0%,100%{opacity:1;}50%{opacity:0.5;} }
        .animate-pulse-slow { animation: pulse-slow 3s infinite; }

        @keyframes float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);} }
        .animate-float { animation: float 3s ease-in-out infinite; }

        @keyframes countUp { from { opacity: 0; } to { opacity: 1; } }
        .animate-countUp { animation: countUp 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
