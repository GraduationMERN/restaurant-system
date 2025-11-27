import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedOptions: {
      type: Object,
      default: {}
    },
    price: {
      type: Number,     // Final price with options
      required: true
    }
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    // RELATIONSHIPS
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      default: null
    },
    
    // USER - Simple: can be ObjectId (registered) or UUID (guest)
    userId: {
      type: String,
      required: true,
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

    // ITEMS (from cart)
    items: [OrderItemSchema],

    // PRICING
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

    // CUSTOMER INFO (for guests)
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" }
    },

    // STATUS
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.model("Order", OrderSchema);