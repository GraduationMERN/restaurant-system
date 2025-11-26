import mongoose from "mongoose";

// =========================
// Order Item Schema
// =========================
const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    img: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    itemPoints: { type: Number, default: 0 },
    selectedOptions: [
      {
        label: String,
        priceDelta: Number,
      }
    ],
  },
  { _id: false }
);

// =========================
// Main Order Schema
// =========================
const OrderSchema = new mongoose.Schema(
  {
    // Restaurant & Customer
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Table & Service Type
    tableNumber: { type: String, default: null },
    serviceType: {
      type: String,
      enum: ["pickup", "delivery", "dine-in"],
      default: "pickup",
    },

    // Items
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    // Pricing Breakdown
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    tip: { type: Number, required: true, min: 0, default: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },

    // Coupon / Discount
    couponCode: { type: String, default: null },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet", "online"],
      default: "cash",
    },
    stripeCheckoutSessionId: { type: String, default: null },
    stripeSessionId: { type: String, default: null },

    // Rewards
    rewardPointsEarned: { type: Number, default: 0 },
    pointsUsed: { type: Number, default: 0 },        // points redeemed
    discountFromPoints: { type: Number, default: 0 }, // equivalent EGP discount from points
    isRewardOrder: { type: Boolean, default: false },

    notes: { type: String, default: "" },

    // Status
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
