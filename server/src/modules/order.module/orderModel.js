import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
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
    // ============= ORDER IDENTIFICATION =============
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // ============= CUSTOMER IDENTIFICATION =============
    // SINGLE customer identifier field - Supports both guest and registered
    customerId: {
      type: String, // Changed: Always String (UUID for guest, ObjectId string for registered)
      required: true,
      index: true,
    },

    // User reference ONLY for registered users
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Customer type (guest or registered)
    customerType: {
      type: String,
      enum: ["guest", "registered"],
      required: true,
    },

    // ============= SERVICE INFORMATION =============
    serviceType: {
      type: String,
      enum: ["dine-in", "takeaway", "pickup", "delivery"],
      required: false,
    },

    tableNumber: {
      type: String,
      default: null,
      required: function () {
        return this.serviceType === "dine-in";
      },
    },

    // ============= DELIVERY (Only for delivery type) =============
    deliveryAddress: {
      type: String,
      default: "",
      required: function () {
        return this.serviceType === "delivery";
      },
    },

    // ============= ORDER ITEMS =============
    items: [OrderItemSchema],

    // ============= PRICING & TOTALS =============
    subtotal: { type: Number, required: true, default: 0 },
    vat: { type: Number, required: true, default: 0 },
    deliveryFee: {
      type: Number,
      default: 0,
      required: function () {
        return this.serviceType === "delivery";
      },
    },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    // ============= PAYMENT INFORMATION =============
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card","instore", "online"],
      required: true,
      default: "cash",
    },

    paidAt: { type: Date, default: null },

    // Stripe
    stripeSessionId: { type: String, default: null },
    stripePaymentIntent: { type: String, default: null },

    // ============= CUSTOMER INFORMATION (For guests & contact) =============
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },

    // ============= COUPON =============
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },

    // ============= ORDER STATUS & TRACKING =============
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // ============= TIME ESTIMATES =============
    estimatedTime: {
      type: Number, // Minutes
      default: null, // Will be set by cashier
    },

    estimatedReadyTime: {
      type: Date,
      default: null,
    },

    // ============= NOTES =============
    notes: { type: String, default: "" },

    // ============= CREATED BY (Cashier/Admin) =============
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ============= DIRECT ORDER FLAG =============
    isDirectOrder: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============= VIRTUALS (SIMPLIFIED) =============

// Progress based on status
OrderSchema.virtual("progressPercentage").get(function () {
  const progressMap = {
    pending: 0,
    confirmed: 25,
    preparing: 50,
    ready: 75,
    completed: 100,
    cancelled: 0,
  };
  return progressMap[this.status] || 0;
});

// Human-readable status
OrderSchema.virtual("statusText").get(function () {
  const statusText = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready for Pickup",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return statusText[this.status] || this.status;
});

// Customer name (with fallback)
OrderSchema.virtual("displayName").get(function () {
  if (this.customerInfo?.name) return this.customerInfo.name;
  if (this.user?.name) return this.user.name;
  return "Guest Customer";
});

// Estimated ready time text
OrderSchema.virtual("estimatedTimeText").get(function () {
  if (!this.estimatedReadyTime) return "Not set";
  const now = new Date();
  const diffMs = this.estimatedReadyTime - now;
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));

  if (diffMinutes <= 0) return "Ready now";
  if (diffMinutes < 60) return `Ready in ${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `Ready in ${hours}h ${mins}m`;
});

// ============= PRE-SAVE MIDDLEWARE =============
OrderSchema.pre("save", async function (next) {
  // Generate order number
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }

  // Set customerType based on user reference
  if (this.isNew) {
    if (this.user) {
      this.customerType = "registered";
      // Ensure customerId matches user._id as string
      this.customerId = this.user.toString();
    } else {
      this.customerType = "guest";
      // If no customerId, generate one
      if (!this.customerId) {
        this.customerId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }
    }
  }

  // Calculate estimatedReadyTime if estimatedTime changed
  if (this.isModified("estimatedTime") && this.estimatedTime) {
    const now = new Date();
    this.estimatedReadyTime = new Date(
      now.getTime() + this.estimatedTime * 60000
    );
  }

  next();
});

// ============= STATIC METHODS =============

// Find active orders (for kitchen/cashier)
OrderSchema.statics.findActiveOrders = function () {
  return this.find({
    status: { $in: ["confirmed", "preparing", "ready"] },
  })
    .sort({ createdAt: 1 })
    .populate("user", "name email phone")
    .populate("createdBy", "name");
};

// Find orders by customer (works for both guest and registered)
OrderSchema.statics.findByCustomerId = function (customerId) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .populate("user", "name email phone")
    .populate("createdBy", "name");
};

// Find pending orders (for cashier confirmation)
OrderSchema.statics.findPendingOrders = function () {
  return this.find({ status: "pending", paymentStatus: "paid" })
    .sort({ createdAt: 1 })
    .populate("user", "name email phone");
};

// ============= INSTANCE METHODS =============

// Check if order can be cancelled
OrderSchema.methods.canCancel = function () {
  return ["pending", "confirmed"].includes(this.status);
};

// Update estimated time (cashier dashboard)
OrderSchema.methods.updateEstimate = function (minutes) {
  this.estimatedTime = minutes;
  this.estimatedReadyTime = new Date(Date.now() + minutes * 60000);
  return this.save();
};

// Update status with validation
OrderSchema.methods.updateStatus = function (newStatus) {
  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready"],
    ready: ["completed"],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  return this.save();
};

// Link guest order to registered user
OrderSchema.methods.linkToUser = function (userId) {
  if (this.customerType === "guest") {
    this.user = userId;
    this.customerType = "registered";
    this.customerId = userId.toString();
    return this.save();
  }
  throw new Error("Order is already linked to a user");
};

// ============= INDEXES (OPTIMIZED) =============
OrderSchema.index({ customerId: 1, createdAt: -1 }); // Customer order history
OrderSchema.index({ status: 1, createdAt: 1 }); // Active orders
OrderSchema.index({ orderNumber: 1 }); // Quick lookup
OrderSchema.index({ "customerInfo.phone": 1 }); // Phone lookup
OrderSchema.index({ estimatedReadyTime: 1 }); // Time-based queries
OrderSchema.index({ createdBy: 1 }); // Cashier orders
OrderSchema.index({ stripeSessionId: 1 }, { sparse: true }); // Payment lookup

export default mongoose.model("Order", OrderSchema);