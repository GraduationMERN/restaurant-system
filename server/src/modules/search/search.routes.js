/**
 * Search Routes
 * /api/search
 */

import { Router } from "express";
import { searchProducts, quickSearchProducts } from "./search.controller.js";

const router = Router();

// POST /api/search - Full semantic search
router.post("/", searchProducts);

// GET /api/search/quick?q=query - Quick autocomplete
router.get("/quick", quickSearchProducts);

export default router;
