import mongoose from "mongoose";


const RewardRedemptionSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rewardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reward",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    pointsUsed: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "completed"
    }
}, { timestamps: true })

const RewardRedemption = mongoose.model("RewardRedemption", RewardRedemptionSchema);
export default RewardRedemption;