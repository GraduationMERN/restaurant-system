import express from 'express';
import { AddReward, deleteReward, getAllRewards, getRewardById, redeemReward, updatePoints, updateReward } from './reward.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
const router = express.Router();

router.get('/', getAllRewards);
router.get('/:id', getRewardById);
// Admin-only operations
router.post('/', authMiddleware, roleMiddleware('admin'), AddReward);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteReward);
router.patch('/:id', authMiddleware, roleMiddleware('admin'), updateReward);
// Authenticated users can redeem rewards for themselves
router.post('/redeem', authMiddleware, redeemReward);
router.patch('/user/:id', authMiddleware, roleMiddleware('admin'), updatePoints);
export default router;