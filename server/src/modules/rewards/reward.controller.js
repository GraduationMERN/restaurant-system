import { getUserByIdService } from '../user/service/user.service.js';
import { createRewardService, deleteRewardService, getAllRewardsServices, getRewardByIdService, redeemRewardService, updateRewardService } from './reward.service.js';

export async function getAllRewards(req, res) {
    try {
        const rewards = await getAllRewardsServices();
        res.status(200).json(rewards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getRewardById(req, res) {
    try {
        const { id } = req.params;
        const reward = await getRewardByIdService(id);
        if (!reward) {
            return res.status(404).json({ message: 'Reward not found' });
        }
        res.status(200).json(reward);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }   
}

export async function AddReward(req, res) {
    try {
        const rewardData = req.body;
        if(!req.body.productId || !req.body.pointsRequired) res.status(402).json({error:"productId and points are required to make the reward"})
        const newReward = await createRewardService(rewardData);
        console.log("Created reward:", newReward);
        res.status(201).json(newReward);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteReward(req,res) {
    try{
        const { id } = req.params;
        await deleteRewardService(id);
        res.status(200).json({ message: 'Reward deleted successfully' });
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

export async function updateReward(req,res) {
    try{
        const { id } = req.params;
        const rewardData = req.body;
        const updatedReward = await updateRewardService(id, rewardData);
        res.status(200).json(updatedReward);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

export async function redeemReward(req, res) {
    try {
        const { rewardId, userId } = req.body;
        const reward = await getRewardByIdService(rewardId)
        const result = await redeemRewardService(rewardId, userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }   
}

export async function updatePoints(req,res){
  try{
    const {id} = req.params;
    const user = await getUserByIdService(id);
    if(!user){
      return res.status(404).json({message:"NOT FOUND"})
    }
    await updatePointsService(id)
    res.status(200).json({user})
  }catch(err){
    res.status(400).json({message:err.message})
  }
}
