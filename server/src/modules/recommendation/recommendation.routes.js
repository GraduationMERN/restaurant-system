import express from "express";
import { 
  getRecommendationsByProduct, 
  getRecommendationsByOrder 
} from "./recommendation.controller.js";

const router = express.Router();

// Route to get similar items (Math-based)
// Example: /api/recommendations/by-product/64f1a2b...
router.get("/by-product/:id", getRecommendationsByProduct);

// Route to get complementary items for the current cart (AI + Math)
// Example: /api/recommendations/by-order?limit=3
router.get("/by-order", getRecommendationsByOrder); // Removed :id, we get it from token/cookies

export default router;