import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createOrderFromCart } from "../redux/slices/orderSlice";
import { useNavigate } from "react-router-dom";
import { updateCartQuantity, deleteProductFromCart, addToCart, getCartForUser,updateCartItemOptions   } from "../redux/slices/cartSlice";
import { ArrowLeft, Plus, Minus, Trash2, Edit2, Star, MapPin, Tag, MessageSquare, ChevronDown, Gift, X } from "lucide-react";
import { useTranslation } from "react-i18next"; // 
// Leaflet (OpenStreetMap) map picker
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon paths for Leaflet in many bundlers
// Fix default icon paths for Leaflet in ESM (Vite) by resolving URLs via import.meta
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("../node_modules/leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("../node_modules/leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("../node_modules/leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { products, totalPrice, loading, _id: cartId } = useSelector(
    (state) => state.cart
  );
  const authUser = useSelector((state) => state.auth?.user || null);

  const [serviceType, setServiceType] = useState("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSelectedPos, setMapSelectedPos] = useState(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showRewardModal, setShowRewardModal] = useState(false);
  

  // Load cart on mount
  useEffect(() => {
    dispatch(getCartForUser());
  }, [dispatch]);

 
const handleQuantityChange = (productId, quantity) => {  // Changed parameter name
  if (quantity < 1) return;
  console.log("Updating quantity for productId:", productId);
  
  dispatch(updateCartQuantity({ 
    cartItemId: productId,  // Using productId (matching CartPage)
    newQuantity: quantity 
  }));
};

// Handle delete product - MATCH CART PAGE
const handleDeleteItem = (productId) => {  // Changed parameter name
  console.log("Deleting productId:", productId);
  dispatch(deleteProductFromCart(productId));  // Using productId (matching CartPage)
};

// Handle option change - Use productId like CartPage would
const handleOptionChange = async (item, optionName, choiceLabel) => {
  try {
    const newSelectedOptions = { 
      ...item.selectedOptions, 
      [optionName]: choiceLabel 
    };
    
    // Since we can't update options directly, we need to:
    // 1. Delete the current item
    // 2. Add it back with new options
    
    await dispatch(deleteProductFromCart(item.productId._id));  // Delete using productId
    
    await dispatch(addToCart({
      productId: item.productId._id,
      quantity: item.quantity,
      selectedOptions: newSelectedOptions
    }));
    
  } catch (err) {
    console.error("options didnt update:", err);
  }
};


  // Compute totals
  const subtotal = products.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vat = +(subtotal * 0.14).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);
  const handleSubmit = async () => {
  if (!cartId) {
    alert("No cart found. Please add items to cart first.");
    return;
  }
  
  if (products.length === 0) {
    alert("Your cart is empty. Please add items before checking out.");
    return;
  }
  
  setSubmitting(true);

  try {
    const res = await dispatch(
      createOrderFromCart({
        cartId,
        serviceType,
        tableNumber,
        notes,
          deliveryLocation,
          customerInfo: {
            name: contactName,
            phone: contactPhone,
            address: contactAddress,
          },
      })
    ).unwrap();

    console.log("Order created:", res);

    // Handle the API response structure
    if (res.success && res.data) {
      navigate("/payment", { 
        state: { 
          orderId: res.data._id || res.data.id,
          order: res.data
        } 
      });
    } else {
      // Fallback if structure is different
      navigate("/payment", { 
        state: { 
          orderId: res._id || res.id,
          order: res
        } 
      });
    }

  } catch (err) {
    console.error("Order creation failed:", err);
    
    // Show user-friendly error
    const errorMessage = err?.message || err || "Failed to create order. Please try again.";
    alert(errorMessage);
    
  } finally {
    setSubmitting(false);
  }
};


const shareMyLocation = () => {
  if (!navigator.geolocation) {
    setLocationError("Geolocation is not supported by your browser");
    return;
  }
  
  setLocationLoading(true);
  setLocationError(null);
  
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      let address = "";
      
      try {
        // Use Nominatim (OpenStreetMap) for reverse geocoding to get address from coordinates
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { "User-Agent": "RestaurantApp" } }
        );
        const data = await resp.json();
        address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch (e) {
        console.warn("Reverse geocoding failed, using coordinates:", e);
        address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      
      setDeliveryLocation({ lat, lng, address });
      // Prefill contact address and user info if available
      setContactAddress(address || "");
      if (authUser) {
        setContactName(authUser.name || "");
        setContactPhone(authUser.phone || "");
      }
      setLocationLoading(false);
    },
    (err) => {
      console.error("Geolocation error:", err);
      if (err.code === 1) {
        setLocationError("Location access denied. Please enable location permissions and try again.");
      } else if (err.code === 2) {
        setLocationError("Position unavailable. Please try again or check your location settings.");
      } else {
        setLocationError("Failed to get location: " + err.message);
      }
      setLocationLoading(false);
    },
    { timeout: 10000, enableHighAccuracy: false }
  );
};

// Simple component to capture map clicks and update marker position
function MapClick({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

const reverseGeocode = async (lat, lng) => {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "RestaurantApp" } }
    );
    const data = await resp.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (e) {
    console.warn("Reverse geocode failed:", e);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

const confirmMapSelection = async () => {
  if (!mapSelectedPos) return;
  const { lat, lng } = mapSelectedPos;
  const address = await reverseGeocode(lat, lng);
  setDeliveryLocation({ lat, lng, address });
  setContactAddress(address || "");
  if (authUser) {
    setContactName(authUser.name || "");
    setContactPhone(authUser.phone || "");
  }
  setShowMapPicker(false);
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("Loading cart...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t("Back") }
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Cart Items (45% width on large screens) */}
          <div className="lg:col-span-7 space-y-6 pl-0 lg:pl-5">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Order</h1>
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <select className="bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 cursor-pointer appearance-none pr-6">
                  <option className="bg-white dark:bg-gray-800">Select Branch</option>
                </select>
                <ChevronDown className="w-4 h-4 -ml-5 pointer-events-none text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Confirm your order so we can prep it.
              </p>
            </div>

            {/* Cart Items */}
            {products.length ? products.map((item) => (
              <div 
                key={item.productId._id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-4">
                  <img 
                    src={item.productId.imgURL} 
                    alt={item.productId.name} 
                    className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base lg:text-lg leading-tight">
                          {item.productId.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          EGP {item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex items-center bg-orange-100 dark:bg-orange-900/20 rounded-full px-1">
                          <button 
                            onClick={() => handleQuantityChange(item.productId._id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleQuantityChange(item.productId._id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full transition-colors"
                          >
                            <Plus className="w-4 h-4" />
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
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                          >
                            <option value="" className="bg-white dark:bg-gray-700">Select {opt.name}</option>
                            {opt.choices.map((choice) => (
                              <option 
                                key={choice._id} 
                                value={choice.label}
                                className="bg-white dark:bg-gray-700"
                              >
                                {choice.label} {choice.priceDelta ? `(+${choice.priceDelta})` : ""}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-4 text-sm">
                      
                      <button 
                        onClick={() => handleDeleteItem(item.productId._id)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-medium"
                >
                  Browse our menu
                </button>
              </div>
            )}

            {/* Rewards Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Rewards</h3>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  View all
                </button>
              </div>
              <div 
                onClick={() => setShowRewardModal(true)}
                className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all duration-300 relative overflow-hidden group border border-orange-100 dark:border-orange-800"
              >
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3">
                  <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">2x</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">your points</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Confirm your order to earn double points
                  </p>
                </div>
              </div>
            </div>

            {/* Add Other Items Button */}
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border-2 border-dashed border-orange-300 dark:border-orange-600 text-orange-500 dark:text-orange-400 rounded-2xl py-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Add other items
            </button>
          </div>

          {/* Right Column - Order Summary (45% width on large screens) */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:sticky lg:top-4">
              {/* Service Type Dropdown */}
              <div className="mb-6">
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none font-medium text-gray-900 dark:text-white transition-colors"
                  >
                    <option value="pickup" className="bg-white dark:bg-gray-700">Pick up</option>
                    <option value="dine-in" className="bg-white dark:bg-gray-700">Dine-in</option>
                    <option value="delivery" className="bg-white dark:bg-gray-700">Delivery</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>

              {serviceType === "delivery" && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Delivery Location
                  </h4>
                  
                  {locationError && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {deliveryLocation ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Location Saved</p>
                            <p className="text-sm text-green-700 dark:text-green-400 break-words">
                              {deliveryLocation.address}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                              {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400">Recipient name</label>
                          <input value={contactName} onChange={(e)=>setContactName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                          <label className="text-xs text-gray-600 dark:text-gray-400">Phone</label>
                          <input value={contactPhone} onChange={(e)=>setContactPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                          <label className="text-xs text-gray-600 dark:text-gray-400">Address</label>
                          <textarea value={contactAddress} onChange={(e)=>setContactAddress(e.target.value)} placeholder="Address details" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>

                        <div className="flex gap-3 mt-3">
                          <button
                            onClick={() => {
                              setDeliveryLocation(null);
                              setLocationError(null);
                            }}
                            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                          >
                            ✏️ Change Location
                          </button>
                          <button
                            onClick={() => setShowMapPicker(true)}
                            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
                          >
                            📍 Pick on map
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <button
                            onClick={shareMyLocation}
                            disabled={locationLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
                          >
                            {locationLoading ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Getting location...
                              </>
                            ) : (
                              <>
                                <MapPin className="w-5 h-5" />
                                Share My Location
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowMapPicker(true)}
                            className="flex-0 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Pick on map
                          </button>
                        </div>
                        {locationError && (
                          <div className="text-sm text-red-600">{locationError}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Offers Section */}
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Star className="w-8 h-8 text-amber-500 dark:text-amber-400" fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">2x your points</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Confirm your order to earn +2,388 points instead of 1,194 points.
                    </p>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Have a promo code?
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  />
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              {/* Table Number for Dine-in */}
              {serviceType === "dine-in" && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Table Number</h3>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Enter table number"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  />
                </div>
              )}

              {/* Special Instructions */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Special Instructions
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests? (e.g., extra sauce, no onions)"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-colors"
                />
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">EGP {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 dark:text-green-400">You earned</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">2x your points</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service</span>
                  <span className="font-medium text-gray-900 dark:text-white">EGP 55.68</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">VAT</span>
                  <span className="font-medium text-gray-900 dark:text-white">EGP {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-orange-500 dark:text-orange-400">EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Confirm Order Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || products.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full relative animate-slideUp">
            <button
              onClick={() => setShowRewardModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-4">
                <Star className="w-20 h-20 text-amber-500 dark:text-amber-400" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">2x your points</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to remove <span className="font-semibold text-amber-500 dark:text-amber-400">2x your points</span> from cart?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowRewardModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                Keep offer
              </button>
              <button
                onClick={() => {
                  setShowRewardModal(false);
                  // Add logic to remove reward here
                }}
                className="w-full bg-white dark:bg-gray-700 border-2 border-orange-300 dark:border-orange-600 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 font-semibold py-3 rounded-xl transition-all duration-300"
              >
                Remove offer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold">Pick delivery location</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMapPicker(false)} className="text-sm text-gray-500">Cancel</button>
              </div>
            </div>
            <div style={{ height: 400 }}>
              <MapContainer center={deliveryLocation ? [deliveryLocation.lat, deliveryLocation.lng] : [30.0444, 31.2357]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClick onClick={(latlng) => setMapSelectedPos(latlng)} />
                {mapSelectedPos && (
                  <Marker position={[mapSelectedPos.lat, mapSelectedPos.lng]}>
                    <Popup>Selected location</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            <div className="p-4 flex gap-3 justify-end border-t dark:border-gray-700">
              <button onClick={() => setShowMapPicker(false)} className="px-4 py-2 rounded-lg border">Close</button>
              <button onClick={confirmMapSelection} className="px-4 py-2 rounded-lg bg-orange-500 text-white">Confirm location</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}