import express from "express";

export const stripeWebhookMiddleware = express.raw({ type: "application/json" });
