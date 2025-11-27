import React from "react";
import { Utensils, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-default flex items-center justify-center px-4">
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
          <h1 className="text-3xl font-bold text-on-surface mb-2">
            Welcome to Bella Vista
          </h1>
          <p className="text-muted">
            Authentic Italian cuisine with a modern twist
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Utensils className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-on-surface mb-1">Browse Menu</h3>
            <p className="text-sm text-muted">Explore our dishes</p>
          </button>

          <button className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-on-surface mb-1">Track Order</h3>
            <p className="text-sm text-muted">Check your status</p>
          </button>
        </div>

        {/* Special Offer Card */}
        <div className="bg-primary-gradient rounded-2xl p-6 shadow-lg text-white">
          <h3 className="text-xl font-bold mb-2">Special Offer!</h3>
          <p className="mb-4 opacity-90">Get 20% off your first order</p>
          <button className="bg-surface text-primary px-6 py-2 rounded-lg font-semibold hover:bg-default transition">
            Claim Now
          </button>
        </div>
      </div>
    </div>
  );
}
