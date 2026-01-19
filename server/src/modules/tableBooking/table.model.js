import mongoose from "mongoose";

const TableSchema = new mongoose.Schema(
  {
    restaurantId: { type: String, index: true, required: false },
    name: { type: String, required: true },
    capacity: { type: Number, default: 1 },
    location: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // Position on floor plan (x, y in pixels or grid units)
    positionX: { type: Number, default: 0 },
    positionY: { type: Number, default: 0 },
    // status used for realtime table state on floor plan
    status: { type: String, enum: ["available", "occupied", "reserved", "cleaning"], default: "available" },
  },
  { timestamps: true }
);

export default mongoose.model("Table", TableSchema);
