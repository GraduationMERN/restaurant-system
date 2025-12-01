// src/modules/payment/paymentRoutes.js
import express from "express";
import PaymentController from "./paymentController.js";

const router = express.Router();

// Create checkout session
router.post("/create", PaymentController.createCheckoutSession);

// Pay in store (cashier)
router.post("/:id/pay-instore", async (req, res) => {
  try {
    const orderId = req.params.id;
    
    console.log(`Marking order ${orderId} for in-store payment`);
    
    // Simple response for in-store payment
    res.json({ 
      success: true, 
      message: "Order marked for in-store payment successfully",
      orderId: orderId,
      paymentMethod: "instore",
      status: "pending"
    });
    
  } catch (err) {
    console.error("Pay instore error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to process in-store payment" 
    });
  }
});

export default router;