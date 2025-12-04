import * as couponService from './coupon.service.js';

// ========== ADMIN ENDPOINTS ==========

// Create new coupon
export const createCoupon = async (req, res) => {
  try {
    const coupon = await couponService.createCouponService(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all coupons
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await couponService.getAllCouponsService(req.user.restaurantId);
    
    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update coupon
export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await couponService.updateCouponService(couponId, req.body);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await couponService.deleteCouponService(couponId);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== CUSTOMER ENDPOINTS ==========

// Validate coupon (called when user enters code)
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderId } = req.body;
    const userId = req.user._id;
    
    const result = await couponService.validateCouponService(
      code,
      userId,
      orderId,
    );
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        couponId: result.coupon._id,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};