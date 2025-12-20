import {
  recommendSimilarToProduct,
  recommendForCart
} from "./recommendation.service.js";
import { v4 as uuidv4 } from "uuid";

// Helper to identify the user (Logged in OR Guest)
function getCartUserId(req, res) {
  console.log("[Recommendations] Cookies received:", req.cookies);
  
  // 1. If user is logged in (via Auth middleware), use their ID
  if (req.user?._id) {
    return req.user._id.toString();
  }

  // 2. If guest, check for existing cookie
  let guestId = req.cookies.guestCartId;
  const isProduction = process.env.NODE_ENV === "production";

  // 3. If no cookie, generate a new Guest ID
  if (!guestId) {
    guestId = uuidv4();
    console.log("[Recommendations] No guestCartId cookie, generating new:", guestId);
    res.cookie("guestCartId", guestId, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
    });
  } else {
    console.log("[Recommendations] Found existing guestCartId:", guestId);
  }
  return guestId;
}

export async function getRecommendationsByProduct(req, res) {
  try {
    const limit = Number(req.query.limit) || 5;
    const recommendations = await recommendSimilarToProduct(
      req.params.id,
      limit
    );
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error("Error in by-product recommendation:", error);
    res.status(400).json({ message: error.message });
  }
}

export async function getRecommendationsByOrder(req, res) {
  console.log("[API] /by-order called");
  try {
    const limit = Number(req.query.limit) || 3;
    const userId = getCartUserId(req, res);
    console.log("[API] Getting recommendations for userId:", userId, "limit:", limit);

    // Call the AI-enhanced service
    const recommendations = await recommendForCart(userId, limit);
    console.log("[API] Got recommendations:", recommendations?.length || 0);

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error("[API] Error in by-order recommendation:", error);
    res.status(400).json({ message: error.message });
  }
}