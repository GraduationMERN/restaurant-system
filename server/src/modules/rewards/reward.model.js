import mongoose  from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    pointsRequired: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
        required: false,
    },
  },
  { timestamps: true }
);

const Reward = mongoose.model("Reward", rewardSchema);
export default Reward;