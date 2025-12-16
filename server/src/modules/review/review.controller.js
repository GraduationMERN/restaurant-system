
import { ReviewService } from "./review.service.js";
import { io, notificationService } from "../../../server.js";
import Order  from "../order.module/orderModel.js";

// CREATE REVIEW
export const createReview = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    // 1. Must be logged in
    if (!userId) {
      return res.status(401).json({ message: "You must be logged in to leave a review." });
    }

    // 2. Must have completed order
    const completedOrders = await Order.find({
      user: userId,
      status: "completed",
    });

    if (completedOrders.length === 0) {
      return res.status(403).json({
        message: "You need at least one completed order to leave a review.",
      });
    }

    // Extract form data (IMPORTANT FIX)
    const { rating, comment, order, anonymous } = req.body;

    // 3. Uploaded photos
    const photos = req.files?.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    // 4. Create review
    const review = await ReviewService.createReview({
      user: anonymous === "true" || anonymous === true ? null : userId,
      order,
      rating,
      comment,
      photos,
      anonymous,
    });

    // 5. Populate review
    const populatedReview = await ReviewService.getReviewById(review._id);

    // Enforce anonymity (remove user from populated)
    if (populatedReview.anonymous) {
      populatedReview.user = null;
    }

    // 6. Emit to admin
    if (io) {
      io.to("admin").emit("new_review", populatedReview);

      await notificationService?.sendToAdmin({
        title: "New Review Submitted",
        message: `A new review with ${rating} stars was submitted by ${
          populatedReview.user?.name || "Anonymous"
        }`,
        type: "review",
        createdAt: new Date(),
      });
    }

    // 7. Response with populated review
    res.status(201).json({ success: true, data: populatedReview });

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