import mongoose from "mongoose";

// Define DeliveryAddress as a separate schema (RECOMMENDED APPROACH)
const DeliveryAddressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: false
  },
  lng: {
    type: Number,
    required: false
  },
  notes: {
    type: String,
    required: false,
    default: ""
  }
}, { _id: false }); // No _id for subdocument

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
      required: false,
      unique: true,
    },

    // ============= CUSTOMER IDENTIFICATION =============
    customerId: {
      type: String,
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

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

    // ============= DELIVERY ADDRESS (FIXED) =============
    // ✅ CORRECT WAY: Use the separate schema
    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: function () {
        return this.serviceType === "delivery";
      },
      default: undefined  // Important: use undefined, not null
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
      enum: ["cash", "card", "instore", "online"],
      required: true,
      default: "cash",
    },

    paidAt: { type: Date, default: null },

    stripeSessionId: { type: String, default: null },
    stripePaymentIntent: { type: String, default: null },

    // ============= CUSTOMER INFORMATION =============
    customerInfo: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    
    stripeCheckoutSessionId: { type: String, default: null },

    // ============= COUPON =============
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },
    promoCode: { type: String, default: null }, 
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
      type: Number,
      default: null,
    },

    estimatedReadyTime: {
      type: Date,
      default: null,
    },

    // ============= NOTES =============
    notes: { type: String, default: "" },

    // ============= CREATED BY =============
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

// ============= VIRTUALS =============

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

OrderSchema.virtual("displayName").get(function () {
  if (this.customerInfo?.name) return this.customerInfo.name;
  if (this.user?.name) return this.user.name;
  return "Guest Customer";
});

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
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }

  if (this.isNew) {
    if (this.user) {
      this.customerType = "registered";
      this.customerId = this.user.toString();
    } else {
      this.customerType = "guest";
      if (!this.customerId) {
        this.customerId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }
    }
  }

  if (this.isModified("estimatedTime") && this.estimatedTime) {
    const now = new Date();
    this.estimatedReadyTime = new Date(
      now.getTime() + this.estimatedTime * 60000
    );
  }

  next();
});

// ============= STATIC METHODS =============

OrderSchema.statics.findActiveOrders = function () {
  return this.find({
    status: { $in: ["confirmed", "preparing", "ready"] },
  })
    .sort({ createdAt: 1 })
    .populate("user", "name email phone")
    .populate("createdBy", "name");
};

OrderSchema.statics.findByCustomerId = function (customerId) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .populate("user", "name email phone")
    .populate("createdBy", "name");
};

OrderSchema.statics.findPendingOrders = function () {
  return this.find({ status: "pending", paymentStatus: "paid" })
    .sort({ createdAt: 1 })
    .populate("user", "name email phone");
};

// ============= INSTANCE METHODS =============

OrderSchema.methods.canCancel = function () {
  return ["pending", "confirmed"].includes(this.status);
};

OrderSchema.methods.updateEstimate = function (minutes) {
  this.estimatedTime = minutes;
  this.estimatedReadyTime = new Date(Date.now() + minutes * 60000);
  return this.save();
};

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

OrderSchema.methods.linkToUser = function (userId) {
  if (this.customerType === "guest") {
    this.user = userId;
    this.customerType = "registered";
    this.customerId = userId.toString();
    return this.save();
  }
  throw new Error("Order is already linked to a user");
};

// ============= INDEXES =============
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ "customerInfo.phone": 1 });
OrderSchema.index({ estimatedReadyTime: 1 });
OrderSchema.index({ createdBy: 1 });
OrderSchema.index({ stripeSessionId: 1 }, { sparse: true });

export default mongoose.model("Order", OrderSchema);