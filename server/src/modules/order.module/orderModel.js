import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true }, // Store product name for history
    img: { type: String, default: "" }, // Store product image for history
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedOptions: {
      type: Object, // { Size: "Large", Cheese: "Extra" }
      default: {}
    },
    price: { // Final price including options (matches cart)
      type: Number,
      required: true
    }
    ,
    // Points snapshot: reward points per unit at the time of ordering
    itemPoints: { type: Number, default: 0 },
    // Backward compatible field name in case some code expects `productPoints` on order items
    productPoints: { type: Number, default: 0 }
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    // RELATIONSHIPS (matches cart structure)
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      default: null
    },
    
    userId: { // Matches cart userId (String for both ObjectId and UUID)
      type: String,
      required: true,
      index: true,
    },

    // ORDER DETAILS
    tableNumber: { 
      type: String, 
      default: null 
    },
    serviceType: {
      type: String,
      enum: ["dine-in", "pickup", "delivery"],
      required: true,
    },

    // ITEMS (from cart products)
    items: [OrderItemSchema],

    // PRICING (calculated from cart + options)
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    // PAYMENT
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

    // CUSTOMER INFO (for guest orders)
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" }
    },

    // ORDER STATUS
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    notes: { 
      type: String, 
      default: "" 
    }
    ,
    // Total points awarded for this order (computed on completed)
    rewardPointsEarned: { type: Number, default: 0 }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });

export default mongoose.model("Order", OrderSchema);