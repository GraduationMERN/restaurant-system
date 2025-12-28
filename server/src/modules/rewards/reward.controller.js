import { getUserByIdService } from '../user/service/user.service.js';
import { createRewardService, deleteRewardService, getAllRewardOrdersServices, getAllRewardsServices, getRewardByIdService, getRewardOrderByIdService, redeemRewardService, updateRewardService } from './reward.service.js';
import RewardOrder from './rewardOrder.js';
import { io } from '../../../server.js';

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
        const { rewardId } = req.body;
        const result = await redeemRewardService(rewardId, userId);
        // if redemption and order are returned, provide them as part of the response
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }   
}

export const getAllRewardOrder = async(req, res)=>{
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [rewards, total] = await Promise.all([
      RewardOrder.find()
        .populate({
          path: "rewardId",
          populate: { path: "productId" }
        })
        .populate("userId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RewardOrder.countDocuments()
    ]);
    
    res.status(200).json({
      items: rewards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
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

    const allowedUpdates = ["status", "notes", "address", "phone", "estimatedTime", "serviceType"];
    const dataToUpdate = {};

    allowedUpdates.forEach(key => {
      if (req.body[key] !== undefined) dataToUpdate[key] = req.body[key];
    });

    const updatedOrder = await RewardOrder.findByIdAndUpdate(
      id,
      { $set: dataToUpdate },
      { new: true }
    ).populate({
      path: 'rewardId',
      populate: { path: 'productId' }
    }).populate('userId', 'name email phone');

    if (!updatedOrder) {
      return res.status(404).json({ message: "Reward order not found" });
    }

    // Format for socket emission
    const formattedOrder = {
      _id: updatedOrder._id,
      type: 'reward',
      orderNumber: `R-${updatedOrder._id.toString().slice(-6)}`,
      status: updatedOrder.status,
      totalAmount: 0,
      paymentStatus: 'paid',
      paymentMethod: 'points',
      serviceType: updatedOrder.serviceType || 'instore',
      createdAt: updatedOrder.redeemedAt || updatedOrder.createdAt,
      estimatedTime: updatedOrder.estimatedTime,
      notes: updatedOrder.notes,
      
      customerInfo: {
        name: updatedOrder.userId?.name || 'Reward Customer',
        email: updatedOrder.userId?.email,
        phone: updatedOrder.phone || updatedOrder.userId?.phone
      },
      user: updatedOrder.userId,
      
      pointsUsed: updatedOrder.pointsUsed,
      reward: updatedOrder.rewardId,
      
      items: updatedOrder.rewardId ? [{
        _id: 'reward',
        productId: updatedOrder.rewardId.productId?._id || updatedOrder.rewardId._id,
        name: updatedOrder.rewardId.name || updatedOrder.rewardId.productId?.name || 'Reward Item',
        quantity: 1,
        price: 0,
        image: updatedOrder.rewardId.productId?.image || updatedOrder.rewardId.image,
        prepared: dataToUpdate.status === 'ready' || dataToUpdate.status === 'completed'
      }] : []
    };

    // Emit socket events
    if (io) {
      console.log('🔔 Emitting reward order update:', {
        orderId: id,
        status: updatedOrder.status,
        type: 'reward'
      });

      // Standard order events
      io.to('kitchen').emit('order:updated', formattedOrder);
      io.to('cashier').emit('order:updated', formattedOrder);
      
      // Status-specific events
      if (dataToUpdate.status) {
        io.to('kitchen').emit('order:status-changed', formattedOrder);
        io.to('cashier').emit('order:status-changed', formattedOrder);
        
        // Emit to specific user
        if (updatedOrder.userId?._id) {
          io.to(`user:${updatedOrder.userId._id}`).emit('order:your-status-changed', formattedOrder);
        }
        
        // Status-specific events
        switch(updatedOrder.status) {
          case 'confirmed':
            io.to('kitchen').emit('order:confirmed', formattedOrder);
            break;
          case 'preparing':
            io.to('kitchen').emit('order:preparing', formattedOrder);
            break;
          case 'ready':
            io.to('kitchen').emit('order:ready', formattedOrder);
            io.to('cashier').emit('order:ready-notification', formattedOrder);
            if (updatedOrder.userId?._id) {
              io.to(`user:${updatedOrder.userId._id}`).emit('order:ready-notification', formattedOrder);
            }
            break;
          case 'completed':
            io.to('kitchen').emit('order:completed', formattedOrder);
            io.to('cashier').emit('order:completed', formattedOrder);
            break;
          case 'cancelled':
            io.to('kitchen').emit('order:cancelled', formattedOrder);
            io.to('cashier').emit('order:cancelled', formattedOrder);
            break;
        }
      }
      
      // Kitchen-specific update
      io.to('kitchen').emit('order:kitchen-update', formattedOrder);
      
      // Admin notification
      io.to('admin').emit('order:updated', formattedOrder);
      
      // Keep your custom events too (for backwards compatibility)
      io.to(updatedOrder.userId._id.toString()).emit('reward_order_updated', updatedOrder);
      io.to(`reward_order_${id}`).emit('reward_order_status_changed', {
        orderId: id,
        status: updatedOrder.status,
        order: updatedOrder
      });
      io.to('admin').emit('reward_order_updated_admin', updatedOrder);
    }

    res.json({ 
      success: true,
      message: "Reward order updated", 
      data: updatedOrder 
    });
  } catch (err) {
    console.error('Update reward order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRewardOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RewardOrder.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Reward order not found' });
    }
    
    // Emit socket event for deletion
    if (io) {
      io.to('kitchen').emit('order:deleted', { orderId: id });
      io.to('cashier').emit('order:deleted', { orderId: id });
      io.to('admin').emit('order:deleted', { orderId: id });
    }
    
    res.json({ 
      success: true,
      message: 'Reward order deleted', 
      data: deleted 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export async function getUserRedemptions(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }

        const redemptions = await RewardOrder.find({ userId })
            .populate({
                path: 'rewardId',
                populate: { path: 'productId' }
            })
            .populate('userId')
            .sort({ createdAt: -1 });

        res.status(200).json(redemptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}