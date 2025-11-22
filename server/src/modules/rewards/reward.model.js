import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        pointsRequired: {
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },

    },
    { timestamps: true }
);

const Reward = mongoose.model("Reward", rewardSchema);
export default Reward;