import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    img: { type: String, default: "" },
    basePrice: { type: Number, required: true }, // Product base price
    finalPrice: { type: Number, required: true }, // Final price including options
    quantity: { type: Number, required: true, min: 1 },
    
    selectedOptions: {
      type: Object,
      default: {},
    },

    productPoints: { type: Number, default: 0 },
    pointsToPay: { type: Number, default: 0 },
  },
  { _id: true } // Keep _id for individual item tracking
);

const OrderSchema = new mongoose.Schema(
  {
    // RELATIONSHIPS
    cartId: { // Reference to the cart this order was created from
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      default: null
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    
    // USER IDENTIFICATION - Support both registered and guest users
    customerId: { // For registered users (ObjectId)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestId: { // For guest users (UUID/string)
      type: String,
      default: null,
      index: true,
    },
    sessionId: { // Browser session for guest tracking
      type: String,
      default: null
    },

    // ORDER ORIGIN & TYPE
    tableNumber: { type: String, default: null },
    serviceType: {
      type: String,
      enum: ["pickup", "delivery", "dine-in"],
      default: "pickup",
    },
    orderType: { // New: track if it's from cart or direct order
      type: String,
      enum: ["cart", "direct", "quick"],
      default: "cart"
    },

    // ORDER ITEMS
    items: [OrderItemSchema],

    // PRICING
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },

    // DISCOUNTS & REWARDS
    couponCode: { type: String, default: null },
    pointsUsed: { type: Number, default: 0 },
    rewardPointsEarned: { type: Number, default: 0 },
    isRewardOrder: { type: Boolean, default: false },

    // PAYMENT
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "failed"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet", "online"],
      default: "cash",
    },
    stripeCheckoutSessionId: { type: String, default: null },

    // CUSTOMER INFO (for delivery/pickup)
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      deliveryAddress: { type: String, default: "" }
    },

    // STATUS TRACKING
    notes: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    
    // TIMESTAMPS for status tracking
    confirmedAt: { type: Date, default: null },
    preparingAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes for efficient querying
OrderSchema.index({ restaurantId: 1, orderStatus: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ guestId: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);