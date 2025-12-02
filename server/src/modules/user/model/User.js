import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },
    googleId: String,
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      minlength: [11, "Phone number must be 11 characters long"],
    },
    role: {
      type: String,
      enum: ["customer", "cashier", "kitchen", "admin"],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          // value must be non-negative; allow 0 for customers; admins, etc. can have points but business logic will restrict them as needed
          return typeof val === 'number' && val >= 0;
        },
        message: "Points must be a non-negative number",
      },
      
    },
    coupon: {
        usedCoupons: [
          {
            couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
            code: String,
            usedAt: { type: Date, default: Date.now }
          }
        ]
      },
    otp: String,
    otpExpires: Date,
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
