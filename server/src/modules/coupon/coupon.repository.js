import { Coupon} from './coupon.model.js';
import { CouponUsage } from './couponUsage.model.js';

// ========== COUPON CRUD ==========

export const createCoupon = async (couponData) => {
  const coupon = new Coupon(couponData);
  return await coupon.save();
};

export const findCouponByCode = async (code, restaurantId) => {
  return await Coupon.findOne({ 
    code: code.toUpperCase(), 
    restaurantId 
  });
};

export const findCouponById = async (couponId) => {
  return await Coupon.findById(couponId);
};

export const getAllCoupons = async (restaurantId) => {
  return await Coupon.find({ restaurantId }).sort({ createdAt: -1 });
};

export const updateCoupon = async (couponId, updateData) => {
  return await Coupon.findByIdAndUpdate(
    couponId,
    updateData,
    { new: true, runValidators: true }
  );
};

export const deleteCoupon = async (couponId) => {
  return await Coupon.findByIdAndDelete(couponId);
};

export const incrementCouponUsage = async (couponId, session = null) => {
  return await Coupon.findByIdAndUpdate(
    couponId,
    { $inc: { currentUses: 1 } },
    { new: true, session }
  );
};

// ========== COUPON USAGE TRACKING ==========

export const recordCouponUsage = async (usageData, session = null) => {
  const usage = new CouponUsage(usageData);
  return await usage.save({ session });
};

export const findUserCouponUsage = async (couponId, userId) => {
  return await CouponUsage.findOne({ couponId, userId });
};

export const countUserCouponUsage = async (couponId, userId) => {
  return await CouponUsage.countDocuments({ couponId, userId });
};

export const getCouponUsageStats = async (couponId) => {
  return await CouponUsage.aggregate([
    { $match: { couponId: mongoose.Types.ObjectId(couponId) } },
    {
      $group: {
        _id: null,
        totalUses: { $sum: 1 },
        totalDiscount: { $sum: '$discountAmount' },
      },
    },
  ]);
};