/**
 * Search Controller
 * Handles HTTP requests for smart search
 */

import { semanticProductSearch, quickSearch } from "./search.service.js";

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

export default {
  searchProducts,
  quickSearchProducts,
};
