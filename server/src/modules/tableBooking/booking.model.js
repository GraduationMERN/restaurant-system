import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    restaurantId: { type: String, index: true, required: false },
    bookingId: { type: String, index: true, unique: false },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: false, index: true }, // Can be null until cashier confirms
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    guests: { type: Number, default: 1 },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    source: { type: String, enum: ["online", "walk-in", "phone"], default: "online" },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["pending", "confirmed", "reserved", "seated", "completed", "cancelled", "no-show"], default: "pending" },
  },
  { timestamps: true }
);

// index for quick lookups
BookingSchema.index({ restaurantId: 1, tableId: 1, date: 1 });

export default mongoose.model("Booking", BookingSchema);
