// coupon.model.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    maxDiscount: {
      type: Number,
      default: null, // null = no limit
    },
    
    expiresAt: {
      type: Date,
      required: true,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Usage limits
    maxTotalUses: {
      type: Number,
      default: null, // null = unlimited
    },
    
    maxUsesPerUser: {
      type: Number,
      default: 1,
    },
    
    currentUses: {
      type: Number,
      default: 0,
    },
    
    // For personal coupons (optional)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = anyone can use
    },
    
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null, // Made optional - set to null if you don't use restaurants
    },
  },
  { timestamps: true }
);

// Index for faster lookups
couponSchema.index({ code: 1, restaurantId: 1 });
couponSchema.index({ userId: 1 });

export const Coupon = mongoose.model('Coupon', couponSchema);