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
      type: Number,
      required: true
    }
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      default: null
    },
    
    userId: {
      type: String,
      required: true,
      index: true,
    },

    tableNumber: { 
      type: String, 
      default: null 
    },
    serviceType: {
      type: String,
      enum: ["dine-in", "pickup", "delivery"],
      required: true,
    },

    items: [OrderItemSchema],

    subtotal: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    tax: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    deliveryFee: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    discount: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    totalAmount: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },

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

    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      deliveryAddress: { type: String, default: "" }
    },

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
  },
  { 
    timestamps: true 
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);