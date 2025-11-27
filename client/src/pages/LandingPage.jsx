import React from "react";
import { Utensils, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-7xl w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"
              alt="Bella Vista"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Bella Vista
          </h1>
          <p className="text-gray-600">
            Authentic Italian cuisine with a modern twist
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Utensils className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Browse Menu</h3>
            <p className="text-sm text-gray-500">Explore our dishes</p>
          </button>

          <button className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Track Order</h3>
            <p className="text-sm text-gray-500">Check your status</p>
          </button>
        </div>

        {/* Special Offer Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
          <h3 className="text-xl font-bold mb-2">Special Offer!</h3>
          <p className="mb-4 opacity-90">Get 20% off your first order</p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
            Claim Now
          </button>
        </div>
      </div>
    </div>
  );
}
