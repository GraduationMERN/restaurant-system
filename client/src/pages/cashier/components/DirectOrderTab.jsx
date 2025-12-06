// DirectOrderTab.jsx - Create direct orders
import React, { useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import DirectOrderForm from "./DirectOrderForm";

export default function DirectOrderTab({ onOrderCreated }) {
  const [showForm, setShowForm] = useState(false);

  const handleOrderCreated = (order) => {
    setShowForm(false);
    onOrderCreated?.(order);
  };

  return (
    <div className="space-y-6">
      {/* Create Order Button */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 border-2 border-green-200 text-center">
        <ShoppingCart className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Direct Order</h2>
        <p className="text-slate-600 mb-6">
          Create a new order directly from the cashier counter. Select items, set payment, and submit.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all inline-flex items-center gap-2 text-lg"
        >
          <Plus className="w-5 h-5" />
          Create New Order
        </button>
      </div>

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
          <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
            1
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Select Items</h3>
          <p className="text-sm text-slate-600">
            Browse the menu and select the items you want to add to the order. Adjust quantities as needed.
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
          <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
            2
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Enter Customer Info</h3>
          <p className="text-sm text-slate-600">
            Enter the customer's name and phone number, or mark them as a walk-in customer.
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
          <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
            3
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Set Payment</h3>
          <p className="text-sm text-slate-600">
            Select payment method and status. The order will be sent to the kitchen immediately.
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <DirectOrderForm
          onOrderCreated={handleOrderCreated}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
