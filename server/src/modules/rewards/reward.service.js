import { getAll, getProductById } from "../product/product.repository.js";
import mongoose from 'mongoose';
import { findUserById, incrementUserPoints, decrementUserPoints } from "../user/repository/user.repository.js";
import { createReward, getAllRewardsRepo, deleteReward, getRewardById, updateReward, createRewardOrderRepo,getAllRewardOrderRepo,getRewardOrderByIdRepo } from "./reward.repo.js";

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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reward = await getRewardById(rewardId);
    const user = await findUserById(userId);

    if (!reward) throw new Error("Reward not found");
    if (!user) throw new Error("User not found");
    if (!reward.isActive) throw new Error("Reward is not active");
    if (user.points < reward.pointsRequired) throw new Error("Insufficient points");

    // deduct points within transaction
    const updatedUser = await reducePointsService(userId, reward.pointsRequired, session);
    if (!updatedUser) throw new Error("Failed to deduct points");

    // create reward order within same session
    const rewardOrderData = {
      userId,
      rewardId,
      pointsUsed: reward.pointsRequired,
      status: "pending",
      redeemedAt: new Date()
    };
    const rewardOrder = await createRewardOrderRepo(rewardOrderData, session);

    await session.commitTransaction();
    session.endSession();

    return { message: "Reward redeemed successfully", rewardOrder };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    // bubble up error for controller to send proper code/message
    throw err;
  }
};

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
        if (!updatedUser) {
            throw new Error('Not enough points');
        }
        return updatedUser;
    } catch (err) {
        // bubble up error message for the service consumer
        throw err;
    }
}

export async function increasePointsService(userId,productId){
    // Basic validation
    if (!userId || !productId) throw new Error('userId and productId are required');
    // Fetch product record via repository to get productPoints
    const product = await getProductById(productId);
    if (!product) throw new Error('Product not found');
    const points = product.productPoints || 0; 

    if (points <= 0) return null; // nothing to award
    // Award points via the awardPointsToUser service (delegation to repo happens there)
    return await awardPointsToUser(userId, points);
}

export async function awardPointsToUser(userId, points, session = null) {
    if (!userId || !points || points <= 0) return null;
    try {
        // Delegate actual DB update to repository layer using optional session
        const user = await incrementUserPoints(userId, points, session);
        return user;
    } catch (err) {
        throw err;
    }
}


export async function getAllRewardOrdersServices(){
    return await getAllRewardOrderRepo();
}

export async function getRewardOrderByIdService(id){
    return await getRewardOrderByIdRepo(id);
}