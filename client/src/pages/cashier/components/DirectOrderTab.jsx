// DirectOrderTab.jsx - Create direct orders
import React, { useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import DirectOrderForm from "./DirectOrderForm";
import { useTranslation } from "react-i18next";

export default function DirectOrderTab({ onOrderCreated }) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  const handleOrderCreated = (order) => {
    setShowForm(false);
    onOrderCreated?.(order);
  };

  return (
    <div className="space-y-6">
      {/* Create Order Button */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 border-2 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800 border-green-200 text-center">
        <ShoppingCart className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t("admin.create_direct_order")}</h2>
        <p className="text-slate-600 dark:text-gray-300 mb-6">
          {t("admin.create_direct_order_desc")}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all inline-flex items-center gap-2 text-lg"
        >
          <Plus className="w-5 h-5" />
          {t("admin.create_new_order")}
        </button>
      </div>

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border border-slate-200 dark:bg-gray-900 dark:border-gray-800 shadow-sm">
          <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
            1
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t("admin.select_items")}</h3>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            {t("admin.select_items_desc")}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200 dark:bg-gray-900 dark:border-gray-800  shadow-sm">
          <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
            2
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t("admin.enter_customer_info")}</h3>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            {t("admin.enter_customer_info_desc")}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200 dark:bg-gray-900 dark:border-gray-800  shadow-sm">
          <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
            3
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t("admin.set_payment")}</h3>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            {t("admin.set_payment_desc")}
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
