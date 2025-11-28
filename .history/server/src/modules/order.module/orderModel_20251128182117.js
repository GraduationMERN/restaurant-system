import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Snapshot of product data
    name: { type: String, required: true },
    img: { type: String, default: "" },

    // Quantity
    quantity: { type: Number, required: true, min: 1 },

    // Options chosen by user
    selectedOptions: {
      type: Object, 
      default: {}
    },

    // Final price per item (after options)
    price: { type: Number, required: true },

    // Points snapshot (optional)
    itemPoints: { type: Number, default: 0 },
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    // -------------------------------------
    //  USER RELATIONS
    // -------------------------------------
    userId: {
      type: String, // Registered user ObjectId OR guest UUID
      required: true,
      index: true,
    },

    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      default: null,
    },

    // -------------------------------------
    //  ORDER TYPE
    // -------------------------------------
    isDirectOrder: {
      type: Boolean,
      default: false,  // true for points order or cashier order
    },

    pointsUsed: { 
      type: Number, 
      default: 0 
    }, // for direct points order

    // -------------------------------------
    //  SERVICE TYPE
    // -------------------------------------
    serviceType: {
      type: String,
      enum: ["dine-in", "pickup", "delivery"],
      required: true,
    },

    tableNumber: {
      type: String,
      default: null,
    },

    // -------------------------------------
    //  ITEMS
    // -------------------------------------
    items: [OrderItemSchema],

    // -------------------------------------
    //  PRICING
    // -------------------------------------
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    // -------------------------------------
    //  PAYMENT
    // -------------------------------------
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "failed"],
      default: "unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      required: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    // -------------------------------------
    //  CUSTOMER INFO (For Guest)
    // -------------------------------------
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },

    // -------------------------------------
    //  COUPONS
    // -------------------------------------
    appliedCoupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
      },
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },

    // -------------------------------------
    // ORDER STATUS
    // -------------------------------------
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },

    // -------------------------------------
    // NOTES
    // -------------------------------------
    notes: {
      type: String,
      default: "",
    },

    // -------------------------------------
    // REWARD POINTS
    // -------------------------------------
    rewardPointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });

export default mongoose.model("Order", OrderSchema);
