import Review from "../models/Review.js";
import "../modules/order.module/orderModel.js"
// import "../models/User.js";
import  "../modules/user/model/User.js";
import { ApiFeatures } from "../utils/ApiFeatures.js";

export const ReviewRepository = {
  
    // Create a new review
  async create(data) { // data: {user, order, rating, comment, status}
    return await Review.create(data); 
  },

  // Retrieve all reviews with filtering, sorting, searching, field selection, and pagination
 async getAllReviews(query) {
    const mongooseQuery = Review.find().populate("user", "name").populate("order", "_id");
    const apiFeatures = new ApiFeatures(mongooseQuery, query)
      .filter()
      .search()
      .sort()
      .fields()
      .paginate();

    const reviews = await apiFeatures.mongooseQuery;
    return { reviews, page: apiFeatures.page };
  },

 
    // Retrieve a single review by its ID
async getReviewById(id) {
    return await Review.findById(id)
      .populate("user", "name")
      .populate("order", "_id");
  },

  // Update a review  by its ID
async updateReview(id, data) {
    return await Review.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

 
    // Delete a review by its ID
   async deleteReview(id) {
    return await Review.findByIdAndDelete(id);
  },


    // Get reviews for a specific order
  async getReviewsByOrder(orderId) {
    return await Review.find({ order: orderId, status: "approved" })
      .populate("user", "name");
  },

    // Get reviews by a specific user
  async getReviewsByUser(userId) {
    return await Review.find({ user: userId })
      .populate("order", "_id");
  }

};