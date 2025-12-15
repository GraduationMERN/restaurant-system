import { recommendSimilarToProduct, recommendForCart } from "./recommendation.service.js";
import { v4 as uuidv4 } from "uuid";

function getCartUserId(req, res) {
  if (req.user?._id) {
    return req.user._id.toString();
  }
  let guestId = req.cookies.guestCartId;
  const isProduction = process.env.NODE_ENV === "production";
  if (!guestId) {
    guestId = uuidv4();
    res.cookie("guestCartId", guestId, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
    });
  }
  return guestId;
}

export async function getRecommendationsByProduct(req, res) {
  try {
    const limit = Number(req.query.limit) || 4;
    const recommendations = await recommendSimilarToProduct(
      req.params.id,
      limit
    );
    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getRecommendationsByOrder(req, res) {
  try {
    const limit = Number(req.query.limit) || 3;
    const userId = getCartUserId(req, res);
    const recommendations = await recommendForCart(userId, limit);
    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

