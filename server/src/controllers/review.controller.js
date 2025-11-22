import { ReviewService } from "../services/review.service.js";
import AppError from "../utils/appError.js";

// CREATE REVIEW
export const createReview = async (req, res, next) => {
  try {
    const { rating, comment, order } = req.body;

    // Cloudinary URLs from multer-storage-cloudinary
    const photos = req.files?.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    const review = await ReviewService.createReview({
      user: req.user?._id || null,
      order,
      rating,
      comment,
      photos,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// GET ALL REVIEWS
export const getAllReviews = async (req, res, next) => {
  try {
    const result = await ReviewService.getAllReviews(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET REVIEW BY ID
export const getReviewById = async (req, res, next) => {
  try {
    const review = await ReviewService.getReviewById(req.params.id);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// UPDATE REVIEW
export const updateReview = async (req, res, next) => {
  try {
    const updated = await ReviewService.updateReview(
      req.params.id,
      req.body,
      // req.user.role
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE REVIEW
export const deleteReview = async (req, res, next) => {
  try {
    const result = await ReviewService.deleteReview(req.params.id, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET REVIEWS FOR A SPECIFIC ORDER
export const getReviewsByOrder = async (req, res, next) => {
  try {
    const reviews = await ReviewService.getReviewsByOrder(req.params.orderId);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// GET REVIEWS BY USER
export const getReviewsByUser = async (req, res, next) => {
  try {
    const reviews = await ReviewService.getReviewsByUser(req.params.userId);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};