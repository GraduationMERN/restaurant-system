import Reward from "./reward.model";

const getAllRewards = async () => {
  return await Reward.find();
}

const getRewardById = async (id) => {
  return await Reward.findById(id);
}

const createReward = async (rewardData) => {
  return await Reward.create(rewardData);
}

export { getAllRewards, getRewardById, createReward };