import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Size"
  name_ar: { type: String},
  required: { type: Boolean, default: false },
  choices: [
    {
      label: { type: String, required: true }, // e.g. "Small"
      label_ar: { type: String}, // e.g. "Small"
      priceDelta: { type: Number, default: 0 }, // +price بالنسبة للأساس
      stock: { type: Number, default: null }, // اختياري - لو لكل اختيار ستوك
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    name_ar: {
      type: String,
    },
    desc: {
      type: String,
      required: true,
    },
    desc_ar: {
      type: String,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    imgURL: {
      type: String,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isnew: {
      type: Boolean,
      default: false,
    },
    productPoints: {
      type: Number,
      required: true,
    },
    pointsToPay: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: [String], // Array of strings for tags like 'spicy', 'vegan', 'Best Seller'
    options: [optionSchema],

    // embedding for AI
    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
