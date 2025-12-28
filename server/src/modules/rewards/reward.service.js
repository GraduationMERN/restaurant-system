
import orderService from "../order.module/order.service.js";
import { getProductById } from "../product/product.repository.js";
import User from "../user/model/User.js";
import { io, notificationService } from "../../../server.js";
import { getUserByIdService } from "../user/service/user.service.js";
import { createReward, getAllRewardsRepo, deleteReward, getRewardById, updateReward, getAllRewardOrderRepo, getRewardOrderByIdRepo, createRewardOrderRepo } from "./reward.repo.js";
import RewardOrder from "./rewardOrder.js";


// Reward services
export const getAllRewardsServices = async () => {
  return await getAllRewardsRepo()
}

export const getRewardByIdService = async (id) => {
  return await getRewardById(id);
}

export const createRewardService = async (rewardData) => {
  // Validate reward data: product must exist and pointsRequired > 0

  if (!rewardData.pointsRequired || rewardData.pointsRequired <= 0) throw new Error("pointsRequired must be a positive number");
  return await createReward(rewardData);
}

export const deleteRewardService = async (id) => {
  return await deleteReward(id);
}

export const updateRewardService = async (id, rewardData) => {
  return await updateReward(id, rewardData);
}


// Redeem reward
export const redeemRewardService = async (rewardId, userId) => {
  try {
    // 1. Validate user and reward existence
    const user = await getUserByIdService(userId);
    const reward = await getRewardById(rewardId);
    if (!user) throw new Error("User not found");
    if (!reward) throw new Error("Reward not found");

    // 2. Check if user has enough points
    if (user.points < reward.pointsRequired) {
      throw new Error("Insufficient points to redeem this reward");
    }

    // 3. Deduct points
    await User.findByIdAndUpdate(
      userId,
      { $inc: { points: -reward.pointsRequired } },
      { new: true }
    );

    // 4. Create reward order
    const created = await createRewardOrderRepo({
      userId,
      rewardId,
      pointsUsed: reward.pointsRequired,
      status: 'confirmed', // Set initial status
      redeemedAt: new Date()
    });

    // 5. Populate the created order for socket emission
    const populatedOrder = await RewardOrder.findById(created._id)
      .populate({
        path: 'rewardId',
        populate: { path: 'productId' }
      })
      .populate('userId', 'name email phone');

    // 6. Format reward order to match regular order structure
    const formattedOrder = {
      _id: populatedOrder._id,
      type: 'reward',
      orderNumber: `R-${populatedOrder._id.toString().slice(-6)}`,
      status: populatedOrder.status,
      totalAmount: 0,
      paymentStatus: 'paid', // Reward orders are "paid" with points
      paymentMethod: 'points',
      serviceType: populatedOrder.serviceType || 'instore',
      createdAt: populatedOrder.redeemedAt || populatedOrder.createdAt,
      estimatedTime: populatedOrder.estimatedTime,
      notes: populatedOrder.notes,

      // Customer info
      customerInfo: {
        name: populatedOrder.userId?.name || 'Reward Customer',
        email: populatedOrder.userId?.email,
        phone: populatedOrder.userId?.phone
      },
      user: populatedOrder.userId,

      // Points info
      pointsUsed: populatedOrder.pointsUsed,
      reward: populatedOrder.rewardId,

      // Items array (required for kitchen display)
      items: populatedOrder.rewardId ? [{
        _id: 'reward',
        productId: populatedOrder.rewardId.productId?._id || populatedOrder.rewardId._id,
        name: populatedOrder.rewardId.name || populatedOrder.rewardId.productId?.name || 'Reward Item',
        quantity: 1,
        price: 0,
        image: populatedOrder.rewardId.productId?.image || populatedOrder.rewardId.image,
        prepared: false
      }] : []
    };

    // 7. Emit socket events (standard order events that frontend listens for)
    try {
      if (io) {
        console.log('🔔 Emitting new reward order:', {
          orderId: populatedOrder._id,
          type: 'reward',
          status: populatedOrder.status,
          user: user.name
        });

        // Emit to kitchen
        global.io.to("cashier").emit("order:new", formattedOrder);
        global.io.to("kitchen").emit("order:new", formattedOrder);

        // Emit to the user who created it
        if (userId) {
          global.io.to(`user:${userId}`).emit('order:created', formattedOrder);
        }
      }

      // Send notification to admin
      await notificationService?.sendToAdmin({
        title: "Reward Redeemed",
        message: `${reward.productId?.name || reward.name || 'Reward item'} redeemed by ${user?.name || 'User'}`,
        type: "reward",
        rewardId: created._id,
        createdAt: new Date(),
      });
    } catch (e) {
      console.error("Failed to emit socket events or send notification:", e);
    }

    return populatedOrder;
  } catch (error) {
    throw new Error(`Redemption failed: ${error.message}`);
  }
};



// calculate order points
export async function calculateRewardPoints(items) {
  let totalPoints = 0;
  for (const item of items) {
    if (item.productId) {
      let product;
      if (item.productId._id) {
        product = item.productId;
      } else {
        try {
          product = await getProductById(item.productId);
        } catch (error) {
          continue;
        }
      }
      if (product && product.productPoints) {
        const itemPoints = product.productPoints * (item.quantity || 1);
        totalPoints += itemPoints;
      }
    }
  }
  return totalPoints;
}

// earning points after order completion 
export async function earningPoints(orderId) {
  try {
    const order = await orderService.getOrder(orderId);
    if (!order.user._id) {
      throw new Error("Order has no associated user for earning points");
    }
    const user = await getUserByIdService(order.user._id);
    if (!user) throw new Error("User not found for earning points");
    const pointsEarned = await calculateRewardPoints(order.items);
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { points: pointsEarned } },
      { new: true }
    );
    return pointsEarned;
  } catch (error) {
    throw new Error(`Earning points failed: ${error.message}`);
  }
}

// Reward order
export async function getAllRewardOrdersServices() {
  return await getAllRewardOrderRepo();
}

export async function getRewardOrderByIdService(id) {
  return await getRewardOrderByIdRepo(id);
}