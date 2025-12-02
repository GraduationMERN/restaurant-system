
import orderService from "../order.module/order.service.js";
import { getProductById } from "../product/product.repository.js";
import User from "../user/model/User.js";
import { getUserByIdService } from "../user/service/user.service.js";
import { createReward, getAllRewardsRepo, deleteReward, getRewardById, updateReward, getAllRewardOrderRepo, getRewardOrderByIdRepo, createRewardOrderRepo } from "./reward.repo.js";


// Reward services
export const getAllRewardsServices = async () => {
    return await getAllRewardsRepo()
}

export const getRewardByIdService = async (id) => {
    return await getRewardById(id);
}

export const createRewardService = async (rewardData) => {
    // Validate reward data: product must exist and pointsRequired > 0

    if (!rewardData.pointsRequired || rewardData.pointsRequired <= 0) throw new Error("pointsRequired must be a positive number");
    return await createReward(rewardData);
}

export const deleteRewardService = async (id) => {
    return await deleteReward(id);
}

export const updateRewardService = async (id, rewardData) => {
    return await updateReward(id, rewardData);
}


// Redeem reward
export const redeemRewardService = async (rewardId, userId) => {
    try {
        // 1. Validate user and reward existence
        const user = await getUserByIdService(userId);
        const reward = await getRewardById(rewardId);
        if (!user) throw new Error("User not found");
        if (!reward) throw new Error("Reward not found");

        // 2. Check if user has enough points
        if (user.points < reward.pointsRequired) throw new Error("Insufficient points to redeem this reward");

        // 3. Deduct points and create reward order
      console.log(`user points -  ${user.points} `)
      console.log(`reward points -  ${reward.pointsRequired} `)

      await User.findByIdAndUpdate(
            userId,
            { $inc: { points: -reward.pointsRequired } },
            { new: true }
        );
        return await createRewardOrderRepo({
            userId,
            rewardId,
            pointsUsed: reward.pointsRequired
        });
    } catch (error) {
        throw new Error(`Redemption failed: ${error.message}`);
    }

}



// calculate order points
export async function calculateRewardPoints(items) {
    let totalPoints = 0;
    for (const item of items) {
        if (item.productId && item.productId.productPoints) {
            totalPoints += item.productId.productPoints * item.quantity;
        }
    }
    return totalPoints;
}

// earning points after order completion 
export async function earningPoints(orderId) {
    try {
        const order = await orderService.getOrder(orderId);
        if (!order.userId) throw new Error("Order has no associated user for earning points");
        const user = await getUserByIdService(order.userId._id);
        if (!user) throw new Error("User not found for earning points");
        const pointsEarned = await calculateRewardPoints(order.items);
        await User.findByIdAndUpdate(
            user.id,
            { $inc: { points: pointsEarned } },
            { new: true }
        );
        return pointsEarned;
    } catch (error) {
        throw new Error(`Earning points failed: ${error.message}`);
    }
}

// Reward order
export async function getAllRewardOrdersServices() {
    return await getAllRewardOrderRepo();
}

export async function getRewardOrderByIdService(id) {
    return await getRewardOrderByIdRepo(id);
}