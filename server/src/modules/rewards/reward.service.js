import { getProductById } from "../product/product.repository.js";
import { findUserById, incrementUserPoints, decrementUserPoints } from "../user/repository/user.repository.js";
import { createReward, getAllRewardsRepo, deleteReward, getRewardById, updateReward } from "./reward.repo.js";

export const getAllRewardsServices = async () => {
    return await getAllRewardsRepo()
}

export const getRewardByIdService = async (id) => {
    return await getRewardById(id);
}

export const createRewardService = async (rewardData) => {
    return await createReward(rewardData);
}

export const deleteRewardService = async (id) => {
    return await deleteReward(id);
}

export const updateRewardService = async (id, rewardData) => {
    return await updateReward(id, rewardData);
}

export const redeemRewardService = async (rewardId, userId) => {
    try {
        // Fetch reward and user using repository functions (DB access lives in repo)
        const reward = await getRewardById(rewardId);
        const user = await findUserById(userId)

        // Business validations
        if (!reward) throw new Error("Reward not found");
        if (!user) throw new Error("User not found");
        if (user.points < reward.pointsRequired)
            throw new Error("Insufficient points");

        // Perform the deduction using service-layer function that delegates to repo
        await reducePointsService(userId, reward.pointsRequired);
        return { message: "Reward redeemed successfully" };
    } catch (err) {
        // Propagate business error message to the caller; repository errors will bubble up too
        return {message:err.message}
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