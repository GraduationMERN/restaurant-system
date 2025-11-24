import mongoose from "mongoose";

// ==========================
// Order Item Schema
// ==========================
const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: { type: String, required: true },

    img: { type: String, default: "" },

    basePrice: { type: Number, required: true }, 

    selectedOptions: [
      {
        label: String,      
        priceDelta: Number, 
      }
    ],

    finalPrice: { type: Number, required: true }, 

    quantity: { type: Number, required: true, min: 1 },

    itemPoints: { type: Number, default: 0 }, 
  },
  { _id: false }
);


// ==========================
// Main Order Schema
// ==========================
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
      enum: ["table", "pickup"],
      default: "pickup",
    },

    // ==========================
    // Items
    // ==========================
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    // ==========================
    // Full Price Breakdown
    // ==========================
    subtotal: { type: Number, required: true, min: 0 },

    tax: { type: Number, default: 0, min: 0 },

    serviceFee: { type: Number, default: 0, min: 0 },

    deliveryFee: { type: Number, default: 0, min: 0 },

    discount: { type: Number, default: 0, min: 0 },

    totalAmount: { type: Number, required: true, min: 0 },

    // ==========================
    // Payment
    // ==========================
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet"],
      default: "cash",
    },

    stripeSessionId: { type: String, default: null },

    // ==========================
    // Rewards
    // ==========================
    rewardPointsEarned: {
      type: Number,
      default: 0,
    },

    isRewardOrder: {
      type: Boolean,
      default: false,
    },

    // ==========================
    // Order Status
    // ==========================
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
