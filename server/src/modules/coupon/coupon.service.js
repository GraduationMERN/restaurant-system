// coupon.service.js
import * as couponRepo from './coupon.repository.js';
import orderService from "../order.module/order.service.js";
import { getUserByIdService } from "../user/service/user.service.js";


// ========== COUPON MANAGEMENT ==========
export const createCouponService = async (couponData) => {
  return await couponRepo.createCoupon(couponData);
};

export const getAllCouponsService = async () => {
  return await couponRepo.getAllCoupons();
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

// Simple validation - just check if coupon exists and is valid
export const validateCouponCodeService = async (code) => {
  try {
    // Find coupon by code
    const coupon = await couponRepo.findCouponByCode(code);

    if (!coupon) {
      return { valid: false, message: 'Coupon not found' };
    }

    // Check if active
    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon is not active' };
    }

    // Check expiration
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return { valid: false, message: 'Coupon has expired' };
    }

    // Check if max uses reached
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, message: 'Coupon has reached maximum uses' };
    }

    return { valid: true, coupon };
  } catch (error) {
    return { valid: false, message: error.message };
  }
};

export const validateCouponService = async (code, userId, orderId) => {
  // 1. Find coupon by code
  const coupon = await couponRepo.findCouponByCode(code);
  const order = await orderService.getOrder(orderId);
  const user = await getUserByIdService(userId);
  console.log(user.coupon.usedCoupons);
  const orderTotal = order.totalAmount;
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

  // 5. Check minimum order amount
  if (orderTotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount is ${coupon.minOrderAmount} EGP`
    };
  }
  // 6. Check user eligibility
  if (user.coupon.usedCoupons.some(c => c.couponId.equals(coupon._id))) {
    return { valid: false, message: "You have already used this coupon" };
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
  await orderService.orderUpdate(orderId, 
    { totalAmount: orderTotal - discountAmount,
    appliedCoupon: { couponId: coupon._id, code: coupon.code, discountAmount },
    coupon: {usedCoupons: [...user.coupon.usedCoupons,{ couponId: coupon._id, code: coupon.code, usedAt: new Date() } ]
  }
   });
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