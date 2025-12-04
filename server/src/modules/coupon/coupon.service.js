// coupon.service.js
import * as couponRepo from './coupon.repository.js';
import orderService from "../order.module/order.service.js";
import { getUserByIdService } from "../user/service/user.service.js";
import Cart from "../cart/Cart.js";
import { calculateOrderTotals, formatCartItemsForOrder } from "../order.module/orderUtils.js";


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

export const validateCouponService = async (code, userId, cartIdOrOrderId) => {
  // 1. Find coupon by code
  const coupon = await couponRepo.findCouponByCode(code);
  const user = await getUserByIdService(userId);
  
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

  // 6. Check user eligibility (if user has already used this coupon)
  if (user.coupon?.usedCoupons?.some(c => c.couponId?.equals(coupon._id))) {
    return { valid: false, message: "You have already used this coupon" };
  }

  // Try to get order first, if it fails try cart
  let orderTotal = 0;
  try {
    const order = await orderService.getOrder(cartIdOrOrderId);
    if (order) {
      orderTotal = order.totalAmount;
    }
  } catch (err) {
    // If it's not an order, try to get cart
    try {
      const cart = await Cart.findById(cartIdOrOrderId).populate("products.productId");
      if (cart) {
        const items = formatCartItemsForOrder(cart.products);
        const totals = calculateOrderTotals(items, 0.14, 0, 0);
        orderTotal = totals.totalAmount;
      }
    } catch (cartErr) {
      return { valid: false, message: 'Unable to validate order/cart total' };
    }
  }

  // 5. Check minimum order amount
  if (orderTotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount is ${coupon.minOrderAmount} EGP`
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