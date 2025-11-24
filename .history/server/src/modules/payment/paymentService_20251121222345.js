import stripe from "stripe";
import mongoose from "mongoose";
import orderRepository from "../order.module/order.repository.js";
import redeemRewardService from "../rewards/redeemReward.service.js";
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  // 1) Create Checkout Session
  async createCheckoutSession(orderId) {
    const order = await OrderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");