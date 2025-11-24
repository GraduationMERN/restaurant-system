import express from "express";
    // import PaymentController from "./payment.controller.js";
import PaymentController from "./paymentController.js";
const router = express.Router();

// For webhook, use express.raw
router.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleWebhook);

router.post("/checkout", PaymentController.createCheckoutSession);

export default router;
