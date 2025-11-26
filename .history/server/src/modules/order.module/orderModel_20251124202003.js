import mongoose from "mongoose";

// Order Item Schema
const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    img: { type: String, default: "" },
    price: { type: Number, required: true }, // final price including options
    quantity: { type: Number, required: true, min: 1 },

    selectedOptions: {
      type: Object, // { Size: "Large", Cheese: "Extra" }
      default: {},
    },

    productPoints: { type: Number, default: 0 }, // points earned per product
    pointsToPay: { type: Number, default: 0 },   // points required to redeem this product
  },
  { _id: false }
);

// Main Order Schema
const OrderSchema = new mongoose.Schema(
  {
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

    tableNumber: { type: String, default: null },
    serviceType: {
      type: String,
      enum: ["pickup", "delivery", "dine-in"],
      default: "pickup",
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    // Pricing breakdown
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },

    couponCode: { type: String, default: null }, // applied coupon or discount code
    pointsUsed: { type: Number, default: 0 }, // points redeemed by the customer

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
    isRewardOrder: { type: Boolean, default: false },

    notes: { type: String, default: "" },

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
