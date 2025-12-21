// DirectOrderForm.jsx - Create direct orders from cashier
import React, { useState } from "react";
import { ShoppingCart, Loader2, DollarSign, User, X } from "lucide-react";
import MenuBrowser from "./MenuBrowser";
import api from "../../../api/axios";
import { useToast } from "../../../hooks/useToast";
import { useTranslation } from "react-i18next";

export default function DirectOrderForm({ onOrderCreated, onCancel }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [step, setStep] = useState(1); // 1: Menu, 2: Customer & Payment
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [walkIn, setWalkIn] = useState(false);
  const [serviceType, setServiceType] = useState("takeaway"); // takeaway or dine-in
  const [tableNumber, setTableNumber] = useState("");

  const subtotal = selectedItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const handleItemSelect = (item) => {
    if (!selectedItems.find((i) => i.productId === item.productId)) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleItemRemove = (productId) => {
    setSelectedItems(selectedItems.filter((i) => i.productId !== productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleItemRemove(productId);
      return;
    }

    setSelectedItems(
      selectedItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
          : item
      )
    );
  };

  const handleSubmitOrder = async () => {
    // Validation
    if (selectedItems.length === 0) {
      toast.showToast({ message: "Add at least one item to the order", type: "error" });
      return;
    }

    if (!walkIn && !customerName.trim()) {
      toast.showToast({ message: t("enter_customer_name"), type: "error" });
      return;
    }

    if (serviceType === "dine-in" && !tableNumber.trim()) {
      toast.showToast({ message: t("enter_table_number"), type: "error" });
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        items: selectedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        })),
        serviceType: serviceType,
        tableNumber: serviceType === "dine-in" ? tableNumber : undefined,
        customerInfo: {
          name: walkIn ? t("walk_in_customer") : customerName,
          phone: customerPhone || "",
          email: ""
        },
        paymentMethod: paymentMethod,
        notes: `Payment Method: ${paymentMethod}`
      };

      const response = await api.post("api/orders/direct", orderData);
      
      if (response.data) {
        toast.showToast({ message: `✅ ${t("order_create_success")}`, type: "success" });
        onOrderCreated(response.data);
        // Reset form
        setSelectedItems([]);
        setCustomerName("");
        setCustomerPhone("");
        setPaymentStatus("paid");
        setPaymentMethod("cash");
        setWalkIn(false);
        setServiceType("takeaway");
        setTableNumber("");
        setStep(1);
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || t("failed_create_order");
      toast.showToast({ message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-green-600 to-emerald-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">{t("create_direct_order")}</h2>
              <p className="text-green-100 text-sm">{t("step_x_of_y", { current: step, total: 2 })}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="hover:bg-green-700 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-200">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                {t("select_items")}
              </h3>
              <MenuBrowser
                selectedItems={selectedItems}
                onItemSelect={handleItemSelect}
                onItemRemove={handleItemRemove}
                onQuantityChange={handleQuantityChange}
              />

              {/* Selected Items Summary */}
              {selectedItems.length > 0 && (
                <div className="mt-6 bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-bold text-slate-900 mb-3">{t("selected_items")} ({selectedItems.length})</h4>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-bold text-amber-600">
                          {t("currency_symbol")}{item.totalPrice?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-green-300 pt-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-700">{t("subtotal")}:</span>
                      <span className="font-bold">{t("currency_symbol")}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-3">
                      <span className="text-slate-700">{t("tax")} (10%):</span>
                      <span className="font-bold">{t("currency_symbol")}{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-amber-600">
                      <span>{t("total")}:</span>
                      <span>{t("currency_symbol")}{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Service Type Selection */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{t("service_type")}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => {
                      setServiceType("takeaway");
                      setTableNumber("");
                    }}
                    className={`px-4 py-3 rounded-lg font-bold transition-all border-2 ${
                      serviceType === "takeaway"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-green-600"
                    }`}
                  >
                    📦 {t("service_type_takeaway")}
                  </button>
                  <button
                    onClick={() => setServiceType("dine-in")}
                    className={`px-4 py-3 rounded-lg font-bold transition-all border-2 ${
                      serviceType === "dine-in"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-green-600"
                    }`}
                  >
                    🍽️ {t("service_type_dine_in")}
                  </button>
                </div>

                {/* Table Number for Dine-In */}
                {serviceType === "dine-in" && (
                  <input
                    type="text"
                    placeholder={t("table_number")}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 mb-6"
                  />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  {t("customer_information")}
                </h3>

                <div className="space-y-4">
                  {/* Walk-In Toggle */}
                  <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={walkIn}
                      onChange={(e) => setWalkIn(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-900">{t("walk_in_customer_desc")}</span>
                  </label>

                  {/* Customer Name */}
                  {!walkIn && (
                    <input
                      type="text"
                      placeholder={t("customer_name")}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  )}

                  {/* Phone */}
                  <input
                    type="tel"
                    placeholder={t("customer_phone_optional")}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  {t("payment_information")}
                </h3>

                <div className="grid grid-cols-1 gap-4 mb-4">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t("payment_method")}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="cash">💵 {t("payment_cash")}</option>
                      <option value="card">💳 {t("payment_card")}</option>
                      <option value="online">🌐 {t("payment_online")}</option>
                    </select>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-medium">
                  {t("direct_order_paid_note")}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-bold text-slate-900 mb-3">{t("order_summary")}</h4>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-700">{t("items")}:</span>
                    <span className="font-bold">{selectedItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">{t("subtotal")}:</span>
                    <span className="font-bold">{t("currency_symbol")}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">{t("tax")}:</span>
                    <span className="font-bold">{t("currency_symbol")}{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-amber-600 border-t border-amber-300 pt-2">
                    <span>{t("total")}:</span>
                    <span>{t("currency_symbol")}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("back")}
            </button>
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={selectedItems.length === 0 || loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {t("continue_to_payment")}
            </button>
          ) : (
            <button
              onClick={handleSubmitOrder}
              disabled={loading || (selectedItems.length === 0 && !walkIn && !customerName)}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("creating_order")}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {t("create_order")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
