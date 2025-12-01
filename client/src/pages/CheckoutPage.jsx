// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createOrderFromCart } from "../redux/slices/orderSlice";
import { useNavigate } from "react-router-dom";
import { updateCartQuantity, deleteProductFromCart, addToCart, getCartForUser } from "../redux/slices/cartSlice";

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, totalPrice, loading, _id: cartId } = useSelector(
    (state) => state.cart
  );

  const [serviceType, setServiceType] = useState("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Load cart on mount
  useEffect(() => {
    dispatch(getCartForUser());
  }, [dispatch]);

  // Handle quantity change
  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    dispatch(updateCartQuantity({ productId, newQuantity: quantity }));
  };

  // Handle delete product
  const handleDeleteItem = (productId) => {
    dispatch(deleteProductFromCart(productId));
  };

  // Handle option change
  const handleOptionChange = (product, optionName, choiceLabel) => {
    const newSelectedOptions = { ...product.selectedOptions, [optionName]: choiceLabel };
    dispatch(addToCart({
      productId: product.productId._id,
      quantity: product.quantity,
      selectedOptions: newSelectedOptions
    }));
  };

  // Compute totals
  const subtotal = products.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vat = +(subtotal * 0.14).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);

  // Handle submit order
  // const handleSubmit = async () => {
  //   if (!cartId) return;
  //   setSubmitting(true);
  //   try {
  //     const res = await dispatch(createOrderFromCart({
  //       cartId,
  //       serviceType,
  //       tableNumber,
  //       notes
  //     })).unwrap();
  //     navigate(`/order-tracking/${res._id || res.id}`);
  //   } catch (err) {
  //     console.error("Order creation failed:", err);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };
  const handleSubmit = async () => {
  if (!cartId) return;
  setSubmitting(true);

  try {
    // create the order from cart
    const res = await dispatch(
      createOrderFromCart({
        cartId,
        serviceType,
        tableNumber,
        notes,
      })
    ).unwrap();

    // navigate to Payment page instead of order-tracking
    // passing orderId in query params or state
    
    navigate("/payment", { state: {  orderId: res.id || res._id || res.orderId,
        order: res } });

  } catch (err) {
    console.error("Order creation failed:", err);
  } finally {
    setSubmitting(false);
  }
};


  if (loading) return <div className="p-8 text-center text-gray-500">Loading cart...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My order</h1>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <select className="bg-transparent border-none focus:outline-none focus:ring-0 text-gray-600 cursor-pointer">
                  <option>Select Branch</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">Confirm your order so we can prep it.</p>
            </div>

            {/* Cart Items */}
            {products.length ? products.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <img 
                    src={item.productId.imgURL} 
                    alt={item.productId.name} 
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base leading-tight">
                          {item.productId.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">EGP {item.price}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex items-center bg-blue-100 rounded-full px-1">
                          <button 
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    {item.productId.options?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.productId.options.map((opt) => (
                          <select
                            key={opt._id}
                            value={item.selectedOptions[opt.name] || ""}
                            onChange={(e) => handleOptionChange(item, opt.name, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:outline-none bg-white"
                          >
                            <option value="">Select {opt.name}</option>
                            {opt.choices.map((choice) => (
                              <option key={choice._id} value={choice.label}>
                                {choice.label} {choice.priceDelta ? `(+${choice.priceDelta})` : ""}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4 mt-3 text-sm">
                      <button className="text-gray-600 hover:text-gray-900 flex items-center transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-red-500 hover:text-red-700 flex items-center transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                Your cart is empty
              </div>
            )}

            {/* Rewards Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Rewards</h3>
                <button className="text-sm text-gray-600 hover:text-gray-900">View all</button>
              </div>
              <div 
                onClick={() => setShowRewardModal(true)}
                className="bg-gradient-to-br from-blue-100 to-cyan-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2">
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-1">2x</p>
                  <p className="text-sm text-blue-700 font-medium">your points</p>
                </div>
              </div>
            </div>

            {/* Add Other Items Button */}
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-2xl py-4 hover:bg-blue-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add other items
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-4">
              {/* Service Type Dropdown */}
              <div className="mb-6">
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:outline-none font-medium text-gray-900"
                  >
                    <option value="pickup">Pick up</option>
                    <option value="dine-in">Dine-in</option>
                    <option value="delivery">Delivery</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Offers Section */}
              <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">2x your points</h3>
                    <p className="text-xs text-gray-600">Confirm you order to earn +2,388 points instead of 1,194 points.</p>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Have a promo code?</h3>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* Table Number for Dine-in */}
              {serviceType === "dine-in" && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Table Number</h3>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Enter table number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Special Instructions */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Special Instructions</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests?"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:outline-none resize-none"
                />
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>EGP {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">You earned</span>
                  <span className="text-green-600 font-medium">2x your points</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Service</span>
                  <span>EGP 55.68</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>VAT</span>
                  <span>EGP {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Confirm Order Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing..." : "Confirm order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowRewardModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-4">
                <svg className="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">2x your points</h2>
              <p className="text-gray-600">
                Are you sure you want to remove <span className="font-semibold">2x your points</span> from cart?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowRewardModal(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Keep offer
              </button>
              <button
                onClick={() => {
                  setShowRewardModal(false);
                  // Add logic to remove reward here
                }}
                className="w-full bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-xl transition-all"
              >
                Remove offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}