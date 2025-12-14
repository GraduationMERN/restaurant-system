import * as couponService from './coupon.service.js';

// ========== ADMIN ENDPOINTS ==========

// Create new coupon
export const createCoupon = async (req, res) => {
  try {
    // Transform client format to server format
    const { code, discountPercentage, maxUses, expiryDate } = req.body;
    
    // Convert client format to model format
    const couponData = {
      code: code.toUpperCase(),
      discountType: 'percentage',
      discountValue: discountPercentage,
      maxTotalUses: maxUses || null,
      expiresAt: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      isActive: true,
    };

    const coupon = await couponService.createCouponService(couponData);
    
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon,
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
    const coupons = await couponService.getAllCouponsService();
    
    // Transform to client format
    const formattedCoupons = coupons.map(c => ({
      _id: c._id,
      code: c.code,
      discountPercentage: c.discountValue,
      maxUses: c.maxTotalUses,
      usedCount: c.currentUses,
      expiryDate: c.expiresAt,
    }));
    
    res.status(200).json({
      success: true,
      coupons: formattedCoupons,
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
    const { code, discountPercentage, maxUses, expiryDate } = req.body;
    
    // Transform client format to server format
    const updateData = {
      code: code?.toUpperCase(),
      discountValue: discountPercentage,
      maxTotalUses: maxUses,
      expiresAt: expiryDate ? new Date(expiryDate) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const coupon = await couponService.updateCouponService(couponId, updateData);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon,
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

// Validate coupon by code (simple GET validation for checkout)
export const validateCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
      });
    }

    const result = await couponService.validateCouponCodeService(code);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
    
    // Transform to client format
    const coupon = {
      _id: result.coupon._id,
      code: result.coupon.code,
      discountPercentage: result.coupon.discountValue,
    };
    
    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      coupon,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

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