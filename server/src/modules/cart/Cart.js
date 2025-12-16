import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      // type:mongoose.Schema.Types.ObjectId,
      type: String, // بدل ObjectId عشان يدعم guest UUID
      ref: "User",
      required: true,
    },
    products: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        selectedOptions: {
          type: Object, //  { Size: "Large", Cheese: "Extra" }
          required: false,
          default: {},
        },
        price: {
          type: Number, // السعر بعد إضافة الـ options
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Cart", cartSchema);
