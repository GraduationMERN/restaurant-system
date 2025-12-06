import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    branding: {
      primaryColor: {
        type: String,
        default: "#2563eb", // fallback
      },
      secondaryColor: {
        type: String,
        default: "#e27e36",
      },
      logoUrl: {
        type: String,
        default: "",
      },
    },

    notifications: {
      newOrder: { type: Boolean, default: true },
      review: { type: Boolean, default: true },
      dailySales: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
