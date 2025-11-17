import express from 'express';
import { AddReward, deleteReward, getAllRewards, getRewardById, redeemReward, updateReward } from './reward.controller.js';
const router = express.Router();

router.get('/', getAllRewards);
router.get('/:id',getRewardById);
router.post('/', AddReward);
router.delete('/:id', deleteReward);
router.patch('/:id', updateReward);
router.post("/redeem", redeemReward);
export default router;