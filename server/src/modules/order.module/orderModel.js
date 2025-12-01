import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    name: { type: String, required: true },
    image: { type: String, default: "" }, // Changed from 'img' to 'image' for consistency
    quantity: { type: Number, required: true, min: 1 },
    selectedOptions: { type: Object, default: {} },
    price: { type: Number, required: true },
    totalPrice: { type: Number, required: true }, // ADDED: price * quantity
    totalPoints: { type: Number, default: 0 }, // Snapshot of reward points
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    // Order Identification
   orderNumber: {
type: String,
required: true,
unique: true,
// removed index: true to avoid duplicate index warning
},
    
    // User & Cart References
    userId: { 
      type: mongoose.Schema.Types.ObjectId, // CHANGED: Always ObjectId for consistency
      ref: "User",
      required: false, 
      index: true 
    },
   cartId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Cart",
  required: function() {
    return !this.isDirectOrder; // required only if it's NOT a direct order
  }
},
isDirectOrder: { type: Boolean, default: false },

    // Order Type
    // orderSource: { 
    //   type: String, 
    //   enum: ["cart", "direct", "cashier"], 
    //   required: true,
    //   default: "cart"
    // },

    // Service Information
    serviceType: { 
      type: String, 
      enum: ["dine-in", "pickup", "delivery"], 
      required: true 
    },
    tableNumber: { type: String, default: null },

    // Order Items
    items: [OrderItemSchema],

    // Pricing & Totals
    subtotal: { type: Number, required: true, default: 0 },
    vat: { type: Number, required: true, default: 0 }, // CHANGED: from 'tax' to 'vat'
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    // Payment Information
    paymentStatus: { 
      type: String, 
      enum: ["pending", "paid", "failed", "refunded"], // CHANGED: from "unpaid" to "pending"
      default: "pending" 
    },
    paymentMethod: { 
      type: String, 
      enum: ["cash", "card", "online"], 
      required: true,
      default: "cash"
    },
    paidAt: { type: Date, default: null },

    // Customer Information
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },

    // Coupon Information
    appliedCoupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null,
      },
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },

    // Order Status & Tracking
    status: { // CHANGED: from 'orderStatus' to 'status'
      type: String, 
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"], // ADDED: "confirmed"
      default: "pending" 
    },
    estimatedTime: { type: Number, default: 25 }, // ADDED: Estimated preparation time in minutes
    notes: { type: String, default: "" },

  },
  { 
    timestamps: true,
toJSON: { virtuals: true },
toObject: { virtuals: true }
}

);
// Applied reward metadata for reward-based orders
OrderSchema.add({
  appliedReward: {
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
    rewardRedemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardOrder' },
  }
});

// Virtual for order duration
OrderSchema.virtual('duration').get(function() {
  if (this.createdAt && this.updatedAt) {
    return this.updatedAt - this.createdAt;
  }
  return null;
});

// Pre-save middleware to generate order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  next();
});

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 }); // CHANGED: from orderStatus to status
// removed OrderSchema.index({ orderNumber: 1 }); <-- duplicate removed
OrderSchema.index({ createdAt: 1 });
OrderSchema.index({ "customerInfo.phone": 1 });

// Static method to find active orders
OrderSchema.statics.findActiveOrders = function() {
  return this.find({
    status: { $in: ["pending", "confirmed", "preparing"] }
  }).sort({ createdAt: 1 });
};

// Instance method to check if order can be cancelled
OrderSchema.methods.canBeCancelled = function() {
  return ["pending", "confirmed"].includes(this.status);
};

// Instance method to calculate estimated completion time
OrderSchema.methods.getEstimatedCompletion = function() {
  const completionTime = new Date(this.createdAt);
  completionTime.setMinutes(completionTime.getMinutes() + this.estimatedTime);
  return completionTime;
};

export default mongoose.model("Order", OrderSchema);