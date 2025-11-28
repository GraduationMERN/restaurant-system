import { getProductById } from "../product/product.repository.js";
import mongoose from 'mongoose';
import { findUserById, incrementUserPoints, decrementUserPoints } from "../user/repository/user.repository.js";
import { createReward, getAllRewardsRepo, deleteReward, getRewardById, updateReward, createRewardRedemption } from "./reward.repo.js";

export const getAllRewardsServices = async () => {
    return await getAllRewardsRepo()
}

export const getRewardByIdService = async (id) => {
    return await getRewardById(id);
}

export const createRewardService = async (rewardData) => {
    // Validate reward data: product must exist and pointsRequired > 0
    const product = await getProductById(rewardData.productId);
    if (!product) throw new Error("Product not found for reward");
    if (!rewardData.pointsRequired || rewardData.pointsRequired <= 0) throw new Error("pointsRequired must be a positive number");
    return await createReward(rewardData);
}

export const deleteRewardService = async (id) => {
    return await deleteReward(id);
}

export const updateRewardService = async (id, rewardData) => {
    return await updateReward(id, rewardData);
}

export const redeemRewardService = async (rewardId, userId) => {
    // Redeem flow: deduct points and create redemption record in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const reward = await getRewardById(rewardId);
        const user = await findUserById(userId);

        if (!reward) throw new Error("Reward not found");
        if (!user) throw new Error("User not found");
        if (!reward.isActive) throw new Error("Reward is not active");
        if (user.points < reward.pointsRequired) throw new Error("Insufficient points");

        // atomically decrement points using session
        await reducePointsService(userId, reward.pointsRequired, session);

        // record redemption
        const redemption = await createRewardRedemption({
            userId,
            rewardId,
            productId: reward.productId,
            pointsUsed: reward.pointsRequired,
            status: 'completed'
        }, session);

        await session.commitTransaction();
        session.endSession();
        return { message: "Reward redeemed successfully", redemption };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return { message: err.message };
    }

}

export async function increasePointsService(userId,productId){
    // Basic validation
    if (!userId || !productId) throw new Error('userId and productId are required');
    // Fetch product record via repository to get productPoints
    const product = await getProductById(productId);
    if (!product) throw new Error('Product not found');
    const points = product.productPoints || 0; // default to 0 if not specified
    if (points <= 0) return null; // nothing to award
    // Award points via the awardPointsToUser service (delegation to repo happens there)
    return await awardPointsToUser(userId, points);
}

export async function awardPointsToUser(userId, points, session = null) {
    // Basic validation: userId and a positive points value are required
    if (!userId || !points || points <= 0) return null;
    try {
        // Delegate actual DB update to repository layer using optional session
        const user = await incrementUserPoints(userId, points, session);
        return user; // return updated user object
    } catch (err) {
        // propagate error to caller so higher layers (service/controller) can handle it
        throw err;
    }
}

export async function reducePointsService(userId, pointsToDeduct, session = null) {
    // Validate input
    if (!userId || !pointsToDeduct || pointsToDeduct <= 0) return null;
    try {
        // Fetch user to check current points balance
        const user = await findUserById(userId);
        if (!user) throw new Error("User not found");

        // Prevent negative balances
        if (user.points < pointsToDeduct) {
            throw new Error("Not enough points");
        }

        // Use repository method to decrement points atomically (supports session)
        const updatedUser = await decrementUserPoints(userId, pointsToDeduct, session);
        return updatedUser;
    } catch (err) {
        // bubble up error message for the service consumer
        throw err;
    }
}