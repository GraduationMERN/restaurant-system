import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    anonymous: {
      type: Boolean,
      default: false,
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
    photos: [
      {
        url: { type: String, required: true }, // public URL
        public_id: { type: String }, // for deleting from cloud
      },
    ],
  },
  { timestamps: true }
);

// Indexes
reviewSchema.index({ user: 1 }); // For querying reviews by user
reviewSchema.index({ order: 1 }); // For querying reviews by order
const Review = mongoose.model("Review", reviewSchema);

export default Review;