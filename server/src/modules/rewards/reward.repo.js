
import Reward from "./reward.model.js";
import RewardOrder from "./rewardOrder.js";

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

const createRewardOrderRepo = async (data, session = null) => {
  // data: { userId, rewardId, pointsUsed, address?, phone?, notes? }
  if (session) {
    const created = await RewardOrder.create([data], { session });
    return created[0];
  }
  return RewardOrder.create(data);
};
const getAllRewardOrderRepo = async() =>{
  return await RewardOrder.find()
  .populate({
    path: "rewardId",
    populate: { path: "productId" }
  })
  .populate("userId")
}

const getRewardOrderByIdRepo = async (id) => {
  return await RewardOrder.findById(id).populate('rewardId').populate('productId').populate('userId');
}
export { getAllRewardsRepo, getRewardById, createReward ,deleteReward,updateReward,createRewardOrderRepo,getAllRewardOrderRepo,getRewardOrderByIdRepo};
