import express from "express";
import PaymentController from "./paymentController.js";

const router = express.Router();

// Webhook must use raw body
router.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleWebhook);

// Create checkout session
router.post("/create-session", PaymentController.createCheckoutSession);

export default router;
