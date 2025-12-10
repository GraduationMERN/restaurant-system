
import { ReviewService } from "./review.service.js";
import { io, notificationService } from "../../../server.js";

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

    // Populate user data for socket emission
    const populatedReview = await ReviewService.getReviewById(review._id);

    // Emit new review event to admin room
    if (io) {
      io.to("admin").emit("new_review", populatedReview);
      
      // Also send notification to admin
      await notificationService?.sendToAdmin({
        title: "New Review Submitted",
        message: `A new review with ${rating} stars was submitted by ${populatedReview.user?.name || "Anonymous"}`,
        type: "review",
        createdAt: new Date()
      });
    }

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

    // Populate user data for socket emission
    const populatedReview = await ReviewService.getReviewById(updated._id);

    // Emit review updated event to admin room
    if (io) {
      io.to("admin").emit("review_updated", populatedReview);
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE REVIEW
export const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const result = await ReviewService.deleteReview(reviewId, req.user);

    // Emit review deleted event to admin room
    if (io) {
      io.to("admin").emit("review_deleted", reviewId);
    }

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