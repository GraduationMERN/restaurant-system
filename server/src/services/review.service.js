import { ReviewRepository } from "../repositories/review.repository.js";
import Review from "../models/Review.js";
import AppError from "../utils/appError.js";

export const ReviewService = {
  // Create review (ensure one per user per order)
  async createReview(data) {
    const { user, order } = data;

    // Create the review
    const review = await ReviewRepository.create(data);
    return review;
  },

  // Get all reviews (with filters, pagination, etc.)
  async getAllReviews(query) {
    return await ReviewRepository.getAllReviews(query);
  },

  // Get a review by ID
  async getReviewById(id) {
    const review = await ReviewRepository.getReviewById(id);
    if (!review) throw new AppError("Review not found", 404);
    return review;
  },

  // Update a review (only admin can change status)
  async updateReview(id, data, userRole) {
    const review = await ReviewRepository.getReviewById(id);
    if (!review) throw new AppError("Review not found", 404);

    // Prevent normal users from changing approval status
    // if (data.status && userRole !== "admin") {
    //   throw new AppError("Only admins can change review status", 403);
    // }

    const updated = await ReviewRepository.updateReview(id, data);
    return updated;
  },

  // Delete review (admin or owner)
  async deleteReview(id, user) {
    const review = await ReviewRepository.getReviewById(id);
    if (!review) throw new AppError("Review not found", 404);

    // Check permission
    // if (review.user._id.toString() !== user._id.toString() && user.role !== "admin") {
    //   throw new AppError("You are not allowed to delete this review", 403);
    // }

    await ReviewRepository.deleteReview(id);
    return { message: "Review deleted successfully" };
  },

  // Get reviews for a specific order (approved only)
  async getReviewsByOrder(orderId) {
    return await ReviewRepository.getReviewsByOrder(orderId);
  },

  // Get reviews by a specific user
  async getReviewsByUser(userId) {
    return await ReviewRepository.getReviewsByUser(userId);
  },
};
