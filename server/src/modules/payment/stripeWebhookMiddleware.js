// src/modules/payment/stripeWebhookMiddleware.js
import express from "express";

// Export a middleware that returns raw body buffer for Stripe signature verification
export const stripeWebhookMiddleware = express.raw({ type: "application/json" });
