import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    name: { type: String, required: true },
    img: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    selectedOptions: { type: Object, default: {} },
    price: { type: Number, required: true },
    itemPoints: { type: Number, default: 0 }, // Snapshot of reward points
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // ObjectId for logged-in or UUID for guest
    createdBy: { type: String, required: true }, // userId or cashierId
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: "Cart", default: null },

    orderSource: { 
      type: String, 
      enum: ["cart", "direct", "cashier"], 
      required: true 
    },
    isDirectOrder: { type: Boolean, default: false }, // true for points order or cashier order
    pointsUsed: { type: Number, default: 0 },

    serviceType: { type: String, enum: ["dine-in", "pickup", "delivery"], required: true },
    tableNumber: { type: String, default: null },

    items: [OrderItemSchema],

    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded", "failed"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["cash", "card", "online"], required: true },
    paidAt: { type: Date, default: null },

    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
     appliedCoupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null,
      },
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },
    
    // subtotal & totalAmount (before/after discount)
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    notes: { type: String, default: "" },

    appliedCoupon: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },

    orderStatus: { type: String, enum: ["pending", "preparing", "ready", "completed", "cancelled"], default: "pending" },
    notes: { type: String, default: "" },

    rewardPointsEarned: { type: Number, default: 0 }, // handled by reward system
  },
  { timestamps: true }
);
// Applied reward metadata for reward-based orders
OrderSchema.add({
  appliedReward: {
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
    rewardRedemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardOrder' },
  }
});

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });

export default mongoose.model("Order", OrderSchema);
