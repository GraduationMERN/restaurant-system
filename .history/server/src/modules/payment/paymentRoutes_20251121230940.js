import express from "express";
import PaymentController from "./paymentController.js";

const router = express.Router();

router.post("/checkout", PaymentController.createCheckoutSession);
router.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleWebhook);

export default router;
