import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    selectedOptions: { type: Object, default: {} },
    price: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    totalPoints: { type: Number, default: 0 },
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
    },
    
    // User & Cart References
    userId: { 
      // type: mongoose.Schema.Types.ObjectId,
      type: String, 
      ref: "User",
      required: false,
      index: true 
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: function() {
        return !this.isDirectOrder;
      }
    },
    isDirectOrder: { type: Boolean, default: false },

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
    vat: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    // Payment Information
    paymentStatus: { 
      type: String, 
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending" 
    },
    paymentMethod: { 
      type: String, 
      enum: ["cash","instore", "card", "online"], 
      required: true,
      default: "cash"
    },
    paidAt: { type: Date, default: null },

    // Stripe
    stripeSessionId: {
      type: String,
      default: null
    },

    // Customer Information
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    stripeCheckoutSessionId: 
    { type: String, default: null },


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
    status: {
      type: String, 
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "pending" 
    },
    
    // Time Estimates
    estimatedTime: { 
      type: Number, 
      default: 25, // Estimated preparation time in minutes
      min: 5,
      max: 120
    },
    estimatedReadyTime: {
      type: Date,
      default: null // Will be calculated automatically
    },
    
    notes: { type: String, default: "" },

    // Applied reward metadata for reward-based orders
    appliedReward: {
      rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
      rewardRedemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardOrder' },
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for order duration
OrderSchema.virtual('duration').get(function() {
  if (this.createdAt && this.updatedAt) {
    return this.updatedAt - this.createdAt;
  }
  return null;
});

// Virtual for formatted estimated ready time
OrderSchema.virtual('formattedEstimatedTime').get(function() {
  if (!this.estimatedReadyTime) return null;
  return this.estimatedReadyTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
});

// Virtual for remaining time in minutes
OrderSchema.virtual('remainingMinutes').get(function() {
  if (!this.estimatedReadyTime) return this.estimatedTime || 25;
  
  const now = new Date();
  const diffMs = this.estimatedReadyTime - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60))); // Convert to minutes
});

// Virtual for order progress percentage
OrderSchema.virtual('progressPercentage').get(function() {
  const statusProgress = {
    "pending": 0,
    "confirmed": 33,
    "preparing": 66,
    "ready": 100,
    "completed": 100,
    "cancelled": 0
  };
  return statusProgress[this.status] || 0;
});

// Pre-save middleware to generate order number and calculate estimatedReadyTime
OrderSchema.pre('save', async function(next) {
  // Generate order number for new orders
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  
  // Calculate estimatedReadyTime for new orders or when estimatedTime changes
  if (this.isNew || this.isModified('estimatedTime')) {
    const estimatedReadyTime = calculateEstimatedReadyTime(
      this.serviceType,
      this.items.length,
      this.estimatedTime || 25
    );
    this.estimatedReadyTime = estimatedReadyTime;
  }
  
  next();
});

// Helper function to calculate estimated ready time
const calculateEstimatedReadyTime = (serviceType, itemsCount, baseTime = 25) => {
  const now = new Date();
  
  // Base preparation time (in minutes)
  let preparationTime = baseTime;
  
  // Add time based on order type
  if (serviceType === "delivery") preparationTime += 10;
  else if (serviceType === "dine-in") preparationTime += 5;
  else if (serviceType === "pickup") preparationTime += 3;
  
  // Add time based on items count
  preparationTime += Math.floor(itemsCount / 2) * 5;
  
  // Set reasonable limits
  preparationTime = Math.max(15, Math.min(preparationTime, 60)); // 15-60 minutes
  
  return new Date(now.getTime() + preparationTime * 60000);
};

// Static method to find active orders
OrderSchema.statics.findActiveOrders = function() {
  return this.find({
    status: { $in: ["pending", "confirmed", "preparing"] }
  }).sort({ createdAt: 1 });
};

// Static method to calculate estimated ready time (can be used externally)
OrderSchema.statics.calculateEstimatedReadyTime = calculateEstimatedReadyTime;

// Instance method to check if order can be cancelled
OrderSchema.methods.canBeCancelled = function() {
  return ["pending", "confirmed"].includes(this.status);
};

// Instance method to calculate estimated completion time (backward compatibility)
OrderSchema.methods.getEstimatedCompletion = function() {
  if (this.estimatedReadyTime) {
    return this.estimatedReadyTime;
  }
  
  // Fallback to old calculation
  const completionTime = new Date(this.createdAt);
  completionTime.setMinutes(completionTime.getMinutes() + (this.estimatedTime || 25));
  return completionTime;
};

// Instance method to update estimated time and recalculate
OrderSchema.methods.updateEstimatedTime = function(newEstimatedTime) {
  this.estimatedTime = newEstimatedTime;
  this.estimatedReadyTime = calculateEstimatedReadyTime(
    this.serviceType,
    this.items.length,
    newEstimatedTime
  );
  return this.save();
};

// Instance method to get time status
OrderSchema.methods.getTimeStatus = function() {
  if (!this.estimatedReadyTime) return "Not estimated";
  
  const now = new Date();
  const diffMs = this.estimatedReadyTime - now;
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  
  if (diffMinutes <= 0) return "Ready";
  if (diffMinutes <= 5) return "Almost ready";
  if (diffMinutes <= 15) return "Coming soon";
  return `In ${diffMinutes} minutes`;
};

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: 1 });
OrderSchema.index({ "customerInfo.phone": 1 });
OrderSchema.index({ estimatedReadyTime: 1 }); // New index for time-based queries
OrderSchema.index({ serviceType: 1, status: 1 }); // For filtering by service type

export default mongoose.model("Order", OrderSchema);