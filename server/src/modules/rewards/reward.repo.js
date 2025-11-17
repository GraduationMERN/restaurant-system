import Reward from "./reward.model.js";

const getAllRewardsRepo = async () => {
  return await Reward.find().populate("productId");
}

const getRewardById = async (id) => {
  return await Reward.findById(id);
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
export { getAllRewardsRepo, getRewardById, createReward ,deleteReward,updateReward};