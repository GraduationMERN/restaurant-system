import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes
reviewSchema.index({ user: 1 }); // For querying reviews by user
reviewSchema.index({ order: 1 }); // For querying reviews by order
reviewSchema.index({ user: 1, order: 1 }, { unique: true }); // One review per user per order

const Review = mongoose.model("Review", reviewSchema);

export default Review;
