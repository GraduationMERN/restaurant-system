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
      type: Number,
      required: [true, "Phone number is required"],
      minlength: [11, "Phone number must be 11 number long"],
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
      valide: {
        validator: function (val) {
          if (this.role === "customer" && val && val >= 0) {
            return true;
          }
          return false;
        },
        message: "Only customers can have points",
      },
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
