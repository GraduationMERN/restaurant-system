import mongoose from "mongoose";

const RewardOrderSchema = new mongoose.Schema(
  {
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pointsUsed: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed"],
      default: "pending"
    },
    redeemedAt: { type: Date, default: Date.now },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    notes: { type: String, default: null }
  },
  { timestamps: true }
);

const RewardOrder = mongoose.model("RewardOrder", RewardOrderSchema);
export default RewardOrder;