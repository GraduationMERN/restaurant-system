import express from "express";
import { getRecommendationsByProduct, getRecommendationsByOrder } from "./recommendation.controller.js";

const router = express.Router();

router.get("/by-product/:id", getRecommendationsByProduct);
router.get("/by-order/:id", getRecommendationsByOrder);

export default router;

