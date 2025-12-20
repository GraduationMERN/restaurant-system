/**
 * Search Controller
 * Handles HTTP requests for smart search
 */

import { semanticProductSearch, quickSearch, imageSearch } from "./search.service.js";

/**
 * POST /api/search
 * Full semantic search with suggestions
 */
export async function searchProducts(req, res) {
  try {
    const { query, limit = 10, lang = "en" } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    const result = await semanticProductSearch(query, { limit, lang });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[SearchController] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
}

/**
 * GET /api/search/quick
 * Quick autocomplete search
 */
export async function quickSearchProducts(req, res) {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        results: [],
      });
    }

    const results = await quickSearch(q, parseInt(limit));

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("[SearchController] Quick search error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Quick search failed",
    });
  }
}

/**
 * POST /api/search/image
 * Search by image - uses Gemini Vision to analyze image
 */
export async function searchByImage(req, res) {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const imageUrl = req.file.path; // Cloudinary URL
    const { limit = 10, lang = "en" } = req.body;

    const result = await imageSearch(imageUrl, { limit: parseInt(limit), lang });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[SearchController] Image search error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Image search failed",
      error: error.message,
    });
  }
}

export default {
  searchProducts,
  quickSearchProducts,
  searchByImage,
};

