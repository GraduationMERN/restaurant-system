import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String },
    },
    badge: {
      type: String,
      enum: ["Sale", "Offer", "Promotion", "Deal"],
      default: "Offer",
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    ctaLink: {
      type: String,
      default: "/menu",
    },
    ctaText: {
      type: String,
      default: "Shop Now",
    },
    startDate: {
      type: Date,
      default: () => new Date(),
    },
    endDate: {
      type: Date,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Index for querying active offers
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
