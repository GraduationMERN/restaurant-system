import express from "express";
import { 
  getRecommendationsByProduct, 
  getRecommendationsByOrder 
} from "./recommendation.controller.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

// Route to get similar items (Math-based)
// Example: /api/recommendations/by-product/64f1a2b...
router.get("/by-product/:id", optionalAuthMiddleware, getRecommendationsByProduct);

// Route to get complementary items for the current cart (AI + Math)
// Example: /api/recommendations/by-order?limit=3
router.get("/by-order", optionalAuthMiddleware, getRecommendationsByOrder);

export default router;