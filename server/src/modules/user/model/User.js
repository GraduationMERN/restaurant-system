import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    avatarUrl: { type: String, default: "" },
    phoneNumber: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
      minlength: [11, "Phone number must be 11 characters long"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["customer", "cashier", "kitchen", "admin"],
      default: "customer",
    },
    address: {
      country: { type: String, default: "" },
      cityState: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      taxId: { type: String, default: "" },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false
    },
    points: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          // value must be non-negative; allow 0 for customers; admins, etc. can have points but business logic will restrict them as needed
          return typeof val === "number" && val >= 0;
        },
        message: "Points must be a non-negative number",
      }
    },
    orderHistory: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
      },
      orderNumber: {
        type: String,
        required: true
      },
      totalAmount: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
        default: "pending"
      },
      date: {
        type: Date,
        default: Date.now
      },
      itemsCount: {
        type: Number,
        default: 0
      },
      serviceType: {
        type: String,
        enum: ["dine-in", "pickup", "delivery"]
      }
    }],
    coupon: {
      usedCoupons: [
        {
          couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
          code: String,
          usedAt: { type: Date, default: Date.now }
        }
      ]
    },
  },
  { timestamps: true }
);

userSchema.index({ phoneNumber: 1 });

const User = mongoose.model("User", userSchema);
export default User;
