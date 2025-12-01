import Reward from "./reward.model.js";
import RewardRedemption from "./rewardRedemption.model.js";

const getAllRewardsRepo = async () => {
  return await Reward.find().populate("productId", "name basePrice desc imgURL categoryId stock isnew productPoints tags");
}

const getRewardById = async (id) => {
  return await Reward.findById(id).populate("productId");
}

const deleteReward = async (id) => {
  return await Reward.findByIdAndDelete(id);
}
const createReward = async (rewardData) => {
  return await Reward.create(rewardData);
}

const updateReward = async (id, rewardData) => {
  return await Reward.findByIdAndUpdate(id, rewardData, { new: true });
}

// Create a reward redemption record, optionally within a session
const createRewardRedemption = async (data, session = null) => {
  if (session) {
    const created = await RewardRedemption.create([data], { session });
    return created[0];
  }
  return RewardRedemption.create(data);
};

export { getAllRewardsRepo, getRewardById, createReward ,deleteReward,updateReward, createRewardRedemption};