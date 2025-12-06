import { env } from "../../config/env.js";
import { recommendSimilarToProduct, recommendForOrder } from "./recommendation.service.js";

export async function getRecommendationsByProduct(req, res) {
  try {
    const limit = Number(req.query.limit) || env.topK;
    const data = await recommendSimilarToProduct(req.params.id, limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getRecommendationsByOrder(req, res) {
  try {
    const limit = Number(req.query.limit) || env.topK;
    const data = await recommendForOrder(req.params.id, limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

