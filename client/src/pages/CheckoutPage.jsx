// src/pages/CheckoutPage.jsx
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createOrderFromCart } from "../redux/slices/orderSlice";
import { useNavigate } from "react-router-dom";
import { updateCartQuantity, deleteProductFromCart, addToCart, getCartForUser, clearCart } from "../redux/slices/cartSlice";
import { ArrowLeft, Plus, Minus, Trash2, MapPin, MessageSquare, ChevronDown, Gift, X } from "lucide-react";
import PointsModal from "../components/PointsModal";
import OrderRecommendations from "../components/recommendations/OrderRecommendations";
import api from "../api/axios";

// Leaflet imports (same as before)
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("../node_modules/leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("../node_modules/leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("../node_modules/leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, totalPrice, loading, _id: cartId } = useSelector(
    (state) => state.cart
  );
  const authUser = useSelector((state) => state.auth?.user || null);

  const [serviceType, setServiceType] = useState("pickup");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSelectedPos, setMapSelectedPos] = useState(null);
  const mapRef = useRef(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [orderError, setOrderError] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Load cart on mount
  useEffect(() => {
    dispatch(getCartForUser());
  }, [dispatch]);

  // Auto-fill contact info from auth user
  useEffect(() => {
    if (authUser && !contactName && !contactPhone) {
      setContactName(authUser.name || "");
      setContactPhone(authUser.phoneNumber || "");
    }
  }, [authUser]);

   useEffect(() => {
    if (!showMapPicker || mapRef.current) return;

    const map = L.map("map", {
      center: [30.0444, 31.2357], // default coordinates
      zoom: 13,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    let marker;

    map.on("click", function (e) {
      const { lat, lng } = e.latlng;
      setMapSelectedPos({ lat, lng });

      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [showMapPicker]);

  // Share user location
  const shareMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDeliveryLocation({
          lat: latitude,
          lng: longitude,
          address: "Current Location",
        });
        setLocationError(null);
        setLocationLoading(false);
      },
      (error) => {
        setLocationError("Unable to retrieve your location.");
        setLocationLoading(false);
      }
    );
  };

  // Save map-picked location
  const saveMapLocation = () => {
    if (mapSelectedPos) {
      setDeliveryLocation({
        ...mapSelectedPos,
        address: "Picked on map",
      });
      setShowMapPicker(false);
    } else {
      setLocationError("Please select a location on the map first.");
    }
  };


  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    console.log("Updating quantity for productId:", productId);

    dispatch(updateCartQuantity({
      cartItemId: productId,
      newQuantity: quantity
    }));
  };

  const handleDeleteItem = (productId) => {
    console.log("Deleting productId:", productId);
    dispatch(deleteProductFromCart(productId));
  };

  const handleOptionChange = async (item, optionName, choiceLabel) => {
    try {
      const newSelectedOptions = {
        ...(item.selectedOptions || {}),
        [optionName]: choiceLabel
      };

      await dispatch(deleteProductFromCart(item.productId._id));

      await dispatch(addToCart({
        productId: item.productId._id,
        quantity: item.quantity,
        selectedOptions: newSelectedOptions
      }));

    } catch (err) {
      console.error("Options didn't update:", err);
    }
  };

  // Compute totals with coupon discount
  const subtotal = products.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vat = +(subtotal * 0.14).toFixed(2);
  let discountAmount = 0;
  
  if (coupon) {
    discountAmount = +(subtotal * (coupon.discountPercentage / 100)).toFixed(2);
  }
  
  const total = +(subtotal + vat - discountAmount).toFixed(2);

  // Apply coupon function
  const applyCoupon = async () => {
    if (!promoCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await api.get(`/api/coupons/validate/${promoCode.trim()}`);
      setCoupon(res.data.coupon);
      setCouponError("");
    } catch (error) {
      setCoupon(null);
      setCouponError(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setCoupon(null);
    setPromoCode("");
    setCouponError("");
  };

  // Calculate total points from cart items
  const totalPoints = products.reduce((acc, item) => {
    const productPoints = item.productId?.productPoints || 0;
    return acc + (productPoints * item.quantity);
  }, 0);

  // Handle order submission
  const handleSubmit = async () => {
    if (!cartId) {
      setOrderError("No cart found. Please add items to cart first.");
      return;
    }

    if (products.length === 0) {
      setOrderError("Your cart is empty. Please add items before checking out.");
      return;
    }

    // Validate service type requirements
    if (serviceType === "delivery") {
      if (!deliveryLocation) {
        setOrderError("Please select a delivery location.");
        return;
      }
      if (!contactName.trim() || !contactPhone.trim()) {
        setOrderError("Please provide your name and phone number for delivery.");
        return;
      }
    }

    if (serviceType === "dine-in" && !tableNumber.trim()) {
      setOrderError("Please enter your table number for dine-in service.");
      return;
    }

    setSubmitting(true);
    setOrderError("");

    try {
      // Prepare order data
      const orderData = {
        cartId,
        serviceType,
        tableNumber: serviceType === "dine-in" ? tableNumber : undefined,
        notes: notes.trim() || undefined,
        customerInfo: {
          name: contactName.trim() || undefined,
          phone: contactPhone.trim() || undefined,
          email: authUser?.email || undefined,
          address: contactAddress.trim() || undefined
        }
      };

      // Include promo code if provided (backend will validate/apply)
      if (promoCode && promoCode.trim()) {
        orderData.promoCode = promoCode.trim();
      }

      // Add delivery location if applicable
      if (serviceType === "delivery" && deliveryLocation) {
        orderData.deliveryLocation = {
          address: deliveryLocation.address,
          lat: deliveryLocation.lat,
          lng: deliveryLocation.lng,
          notes: notes.trim() || undefined
        };
      }

      console.log("Submitting order data:", orderData);

      // Dispatch order creation
      const result = await dispatch(createOrderFromCart(orderData)).unwrap();

      console.log("Order creation response:", result);

      // Handle response based on backend structure
      if (result.success && result.data) {
        // Clear the cart on the client since order was created successfully
        try {
          await dispatch(clearCart()).unwrap();
        } catch (clearErr) {
          // Non-blocking: log and continue to navigate to payment
          console.warn("Failed to clear cart after order creation:", clearErr);
        }

        // Navigate to payment page with order data
        navigate("/payment", {
          state: {
            orderId: result.data._id,
            order: result.data
          }
        });
      } else {
        // Handle error response
        setOrderError(result.message || "Failed to create order. Please try again.");
      }

    } catch (err) {
      console.error("Order creation failed:", err);

      // Handle different error formats
      if (err.message) {
        setOrderError(err.message);
      } else if (typeof err === 'string') {
        setOrderError(err);
      } else {
        setOrderError("Failed to create order. Please try again.");
      }

    } finally {
      setSubmitting(false);
    }
  };


  // (react-leaflet removed) map clicks handled by Leaflet instance in effect


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading cart...</p>
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
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary/90 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Error Display */}
        {orderError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-300 text-center font-medium">{orderError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-7 space-y-6 pl-0 lg:pl-5">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Order</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Confirm your order so we can prep it.
              </p>
            </div>

            {/* Cart Items */}
            {products.length ? products.map((item) => (
              <div
                key={item._id}
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
                        <div className="flex items-center bg-primary/10 dark:bg-primary/10 rounded-full px-1">
                          <button
                            onClick={() => handleQuantityChange(item.productId._id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-primary dark:text-primary/90 hover:bg-primary/20 dark:hover:bg-primary/20 rounded-full transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.productId._id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-primary dark:text-primary/90 hover:bg-primary/20 dark:hover:bg-primary/20 rounded-full transition-colors"
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
                            value={(item.selectedOptions || {})[opt.name] || ""}
                            onChange={(e) => handleOptionChange(item, opt.name, e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
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
                  className="mt-4 text-primary dark:text-primary/90 hover:text-primary/110 dark:hover:text-primary/90 font-medium"
                >
                  Browse our menu
                </button>
              </div>
            )}

            {/* Order-based Recommendations */}
            {products.length > 0 && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <OrderRecommendations />
              </div>
            )}

            {/* Add Other Items Button */}
            <button
              onClick={() => navigate('/menu')}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border-2 border-dashed border-primary/90 dark:border-primary/110 text-primary dark:text-primary/90 rounded-2xl py-4 hover:bg-white dark:hover:bg-primary-900/10 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Add other items
            </button>

            {/* Points Modal - Always Visible */}
            {totalPoints > 0 && (
              <PointsModal totalPoints={totalPoints} />
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:sticky lg:top-4">
              {/* Service Type Dropdown */}
              <div className="mb-6">
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none font-medium text-gray-900 dark:text-white transition-colors"
                  >
                    <option value="pickup" className="bg-white dark:bg-gray-700">Pick up</option>
                    <option value="dine-in" className="bg-white dark:bg-gray-700">Dine-in</option>
                    <option value="delivery" className="bg-white dark:bg-gray-700">Delivery</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Delivery Section */}
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
                            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                              Location Saved
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400 break-words">
                              {deliveryLocation.address}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                              {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <input
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Full name"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <input
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="Phone number"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <textarea
                            value={contactAddress}
                            onChange={(e) => setContactAddress(e.target.value)}
                            placeholder="Address details"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
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
                            className="flex-1 flex items-center justify-center gap-2
             bg-primary hover:bg-primary/90
             disabled:opacity-50 disabled:cursor-not-allowed
             text-white font-semibold py-3 rounded-xl transition-all"
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
className="flex-0 px-4 py-3 rounded-xl
           bg-primary hover:bg-primary/90
           border border-primary/30
           text-white
           transition-all"
                          >
                            Pick on map
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Map picker handled in modal below */}
                  </div>
                </div>
              )}

              {/* Table Number for Dine-in */}
              {serviceType === "dine-in" && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Table Number</h3>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Enter table number"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-colors"
                />
              </div>

              {/* Promo / Coupon */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Gift className="w-4 h-4 mr-2" />
                  Coupon / Promo Code
                </h3>
                
                {coupon ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-200">{coupon.code}</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {coupon.discountPercentage}% discount applied
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {couponLoading ? "Checking..." : "Apply"}
                    </button>
                  </div>
                )}
                
                {couponError && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">{couponError}</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">EGP {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">VAT</span>
                  <span className="font-medium text-gray-900 dark:text-white">EGP {vat.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 dark:text-green-400">Discount ({coupon?.discountPercentage}%)</span>
                    <span className="font-medium text-green-600 dark:text-green-400">-EGP {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-primary dark:text-primary/90">EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Confirm Order Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || products.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Order...
                  </span>
                ) : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <div id="map" style={{ height: "100%", width: "100%" }} />
            </div>
            <div className="p-4 flex gap-3 justify-end border-t dark:border-gray-700">
              <button onClick={() => setShowMapPicker(false)} className="px-4 py-2 rounded-lg border">Close</button>
              <button onClick={saveMapLocation} className="px-4 py-2 rounded-lg bg-primary text-white">Confirm location</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
