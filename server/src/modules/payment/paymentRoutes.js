// src/modules/payment/paymentRoutes.js
import express from "express";
import PaymentController from "./paymentController.js";
import OrderRepository from "../order.module/order.repository.js"; // CORRECT PATH
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";
const router = express.Router();

// Create checkout session
router.post("/create", PaymentController.createCheckoutSession);

// Pay in store (cashier)
// router.post("/:id/pay-instore", async (req, res) => {
//   try {
//     const orderId = req.params.id;
    
//     // Check if OrderRepository exists
//     if (!OrderRepository || !OrderRepository.updatePayment) {
//       throw new Error("OrderRepository is not properly configured");
//     }
    
//     // Update order with instore payment method
//     const updatedOrder = await OrderRepository.updatePayment(orderId, {
//       paymentMethod: "instore",
//       paymentStatus: "pending"
//     });
    
//     res.json({ 
//       success: true, 
//       message: "Order marked for in-store payment successfully",
//       orderId: orderId,
//       paymentMethod: "instore",
//       status: "pending",
//       order: updatedOrder
//     });
    
//   } catch (err) {
//     console.error("Pay instore error:", err);
//     res.status(500).json({ 
//       success: false, 
//       message: err.message || "Failed to process in-store payment" 
//     });
//   }
// });
router.post("/:id/pay-instore", optionalAuthMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    console.log("=== PAY INSTORE - USING UPDATED REPOSITORY ===");
    
    if (!OrderRepository || !OrderRepository.updatePaymentWithUser) {
      throw new Error("OrderRepository is not properly configured");
    }
    
    const updateData = {
      paymentMethod: "instore",
      paymentStatus: "pending",
      updatedAt: new Date()
    };
    
    // استخدم الدالة الجديدة
    const updatedOrder = await OrderRepository.updatePaymentWithUser(orderId, updateData);
    
    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Order marked for in-store payment successfully",
      orderId: orderId,
      paymentMethod: "instore",
      status: "pending",
      order: updatedOrder,
      hasUser: !!updatedOrder._doc.user,
      isGuest: req.user?.isGuest || false
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