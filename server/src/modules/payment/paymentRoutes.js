import express from "express";
import PaymentController from "./paymentController.js";
import { stripeWebhookMiddleware } from "./stripeWebhookMiddleware.js";

const router = express.Router();

// Webhook route
router.post("/webhook", stripeWebhookMiddleware, PaymentController.handleWebhook);

// Checkout session
router.post("/checkout", PaymentController.createCheckoutSession);

export default router;
