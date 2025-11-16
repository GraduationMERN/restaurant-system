import { createRewardService, deleteRewardService, getAllRewardsServices, getRewardByIdService, updateRewardService } from './reward.service.js';

async function getAllRewards(req, res) {
    try {
        const rewards = await getAllRewardsServices();
        res.status(200).json(rewards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getRewardById(req, res) {
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

async function AddReward(req, res) {
    try {
        console.log("Incoming body:", req.body);
        const rewardData = req.body;
        const newReward = await createRewardService(rewardData);
        console.log("Created reward:", newReward);
        res.status(201).json(newReward);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function deleteReward(req,res) {
    try{
        const { id } = req.params;
        await deleteRewardService(id);
        res.status(200).json({ message: 'Reward deleted successfully' });
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

async function updateReward(req,res) {
    try{
        const { id } = req.params;
        const rewardData = req.body;
        const updatedReward = await updateRewardService(id, rewardData);
        res.status(200).json(updatedReward);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

export { getAllRewards, AddReward,deleteReward, getRewardById,updateReward };