import React, { useState } from 'react';
import { Star, Sparkles, Percent, Coffee, UtensilsCrossed } from 'lucide-react';

export default function RewardPage() {
  const [points] = useState(1250);
  const nextReward = 1500;
  const progress = (points / nextReward) * 100;

  const rewards = [
    { id: 1, name: 'Free Dessert', points: 500, icon: Sparkles },
    { id: 2, name: '10% Off Next Order', points: 750, icon: Percent },
    { id: 3, name: 'Free Drink', points: 300, icon: Coffee },
    { id: 4, name: 'Free Appetizer', points: 400, icon: UtensilsCrossed }
  ];

  const canRedeem = (rewardPoints) => points >= rewardPoints;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Rewards</h1>

        {/* Points Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Star className="w-12 h-12 opacity-20" />
          </div>
          <div className="relative">
            <p className="text-blue-100 text-sm mb-1">Your Points</p>
            <h2 className="text-4xl font-bold mb-4">{points.toLocaleString()}</h2>
            <div className="space-y-2">
              <p className="text-sm text-blue-100">Next reward at {nextReward.toLocaleString()} points</p>
              <div className="bg-blue-400 bg-opacity-30 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Available Rewards Section */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rewards</h2>
        
        <div className="space-y-3">
          {rewards.map((reward) => {
            const Icon = reward.icon;
            const isAvailable = canRedeem(reward.points);
            
            return (
              <div 
                key={reward.id}
                className={`bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between ${
                  isAvailable ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isAvailable ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isAvailable ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                    <p className="text-sm text-gray-500">{reward.points} points</p>
                  </div>
                </div>
                <button
                  disabled={!isAvailable}
                  className={`px-5 py-2 rounded-lg font-semibold transition ${
                    isAvailable
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Redeem
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}