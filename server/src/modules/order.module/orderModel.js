import mongoose from "mongoose";
// Order Item Schema
const OrderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: false,  
    },

    name: { type: String, required: true },

    img: { type: String, default: "" },

    price: { type: Number, required: true },

    quantity: { type: Number, required: true, min: 1 },

    itemPoints: { type: Number, default: 0 }
  },
  { _id: false }
);
// Order Schema
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

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    totalAmount: { type: Number, required: true, min: 0 },

    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

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
    stripeCheckoutSessionId: 
    { type: String, default: null },


    rewardPointsEarned: {
      type: Number,
      default: 0,
    },
    isRewardOrder: {
      type: Boolean,
      default: false, 
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
// Export Model 
export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
