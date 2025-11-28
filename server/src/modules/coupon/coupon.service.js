// coupon.service.js
import * as couponRepo from './coupon.repository.js';

// ========== HELPER FUNCTION ==========

// Generate random coupon code
export const generateCouponCode = (prefix = 'GIFT') => {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}`;
};

// ========== COUPON MANAGEMENT ==========

export const createCouponService = async (couponData) => {
  // Auto-generate code if not provided
  if (!couponData.code) {
    couponData.code = generateCouponCode();
  }
  
  return await couponRepo.createCoupon(couponData);
};

export const getAllCouponsService = async (restaurantId) => {
  return await couponRepo.getAllCoupons(restaurantId);
};

export const getCouponByIdService = async (couponId) => {
  return await couponRepo.findCouponById(couponId);
};

export const updateCouponService = async (couponId, updateData) => {
  return await couponRepo.updateCoupon(couponId, updateData);
};

export const deleteCouponService = async (couponId) => {
  return await couponRepo.deleteCoupon(couponId);
};

// ========== COUPON VALIDATION ==========

export const validateCouponService = async (code, userId, orderTotal, restaurantId) => {
  // 1. Find coupon by code
  const coupon = await couponRepo.findCouponByCode(code, restaurantId);
  
  if (!coupon) {
    return { valid: false, message: 'Coupon not found' };
  }
  
  // 2. Check if active
  if (!coupon.isActive) {
    return { valid: false, message: 'Coupon is not active' };
  }
  
  // 3. Check expiration
  if (new Date() > coupon.expiresAt) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  // 4. Check if user-specific
  if (coupon.userId && coupon.userId.toString() !== userId.toString()) {
    return { valid: false, message: 'This coupon is not valid for your account' };
  }
  
  // 5. Check minimum order amount
  if (orderTotal < coupon.minOrderAmount) {
    return { 
      valid: false, 
      message: `Minimum order amount is ${coupon.minOrderAmount} EGP` 
    };
  }
  
  // 6. Check total usage limit
  if (coupon.maxTotalUses && coupon.currentUses >= coupon.maxTotalUses) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // 7. Check per-user usage limit
  const userUsageCount = await couponRepo.countUserCouponUsage(coupon._id, userId);
  
  if (userUsageCount >= coupon.maxUsesPerUser) {
    return { 
      valid: false, 
      message: 'You have already used this coupon the maximum number of times' 
    };
  }
  
  // 8. Calculate discount
  let discountAmount = 0;
  
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderTotal * coupon.discountValue) / 100;
    
    // Apply max discount cap if set
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discountValue;
    
    // Discount cannot exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }
  }
  
  // Round to 2 decimals
  discountAmount = Math.round(discountAmount * 100) / 100;
  
  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount: orderTotal - discountAmount,
  };
};

// ========== APPLY COUPON ==========

export const applyCouponService = async (couponId, userId, orderId, discountAmount, session = null) => {
  // Record usage in CouponUsage collection
  await couponRepo.recordCouponUsage(
    {
      couponId,
      userId,
      orderId,
      discountAmount,
    },
    session
  );
  
  // Increment usage counter
  await couponRepo.incrementCouponUsage(couponId, session);
};