import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
    {
        // Optional link to a product — either productId or name will be used
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: false,
        },
        // Friendly name for reward (if not tied to product)
        name: {
            type: String,
            default: null,
        },
        // Points required to redeem this reward
        pointsRequired: {
            type: Number,
            required: true,
        },
        // Optional human readable description
        desc: {
            type: String,
            default: null,
        },
        // Optional image URL used by the front-end
        image: {
            type: String,
            default: null,
        },
        // Offer type (free_product, discount, multiplier, coupon, etc.)
        type: {
            type: String,
            enum: ["free_product", "discount", "multiplier", "coupon", "generic"],
            default: "generic",
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