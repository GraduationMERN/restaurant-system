import { getUserByIdService } from '../user/service/user.service.js';
import { createRewardService, deleteRewardService, getAllRewardOrdersServices, getAllRewardsServices, getRewardByIdService, getRewardOrderByIdService, redeemRewardService, updateRewardService } from './reward.service.js';
import RewardOrder from './rewardOrder.js';

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
        if ((!req.body.productId && !req.body.name) || !req.body.pointsRequired) return res.status(402).json({error:"Either productId or name is required and points are required to create the reward"})
        if (req.file && req.file.path) {
            rewardData.image = req.file.path;
        }
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
        if (req.file && req.file.path) rewardData.image = req.file.path;
        const updatedReward = await updateRewardService(id, rewardData);
        res.status(200).json(updatedReward);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

export async function redeemReward(req, res) {
    try {
        // Prefer authenticated user id (secure) — fall back to payload if present
      
        const userId = req.user?.id;
        console.log("UserID:"+userId)
        const { rewardId } = req.body;
        const result = await redeemRewardService(rewardId, userId);
        // if redemption and order are returned, provide them as part of the response
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }   
}

export const getAllRewardOrder = async(req,res)=>{
       try {
        const rewards = await getAllRewardOrdersServices();
        res.status(200).json(rewards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }  
}

export const getRewardOrderById = async(req,res)=>{
       try {
        const { id } = req.params;
        const reward = await getRewardOrderByIdService(id);
        if (!reward) {
            return res.status(404).json({ message: 'Reward not found' });
        }
        res.status(200).json(reward);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }   
}

export const updateRewardOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedUpdates = ["status", "notes", "address", "phone"];
    const dataToUpdate = {};

    allowedUpdates.forEach(key => {
      if (req.body[key] !== undefined) dataToUpdate[key] = req.body[key];
    });

    const updatedOrder = await RewardOrder.findByIdAndUpdate(
      id,
      { $set: dataToUpdate },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Reward order not found" });
    }

    res.json({ message: "Reward order updated", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRewardOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await RewardOrder.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Reward order not found' });
        res.json({ message: 'Reward order deleted', order: deleted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};