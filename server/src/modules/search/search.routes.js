/**
 * Search Routes
 * /api/search
 */

import { Router } from "express";
import { searchProducts, quickSearchProducts, searchByImage } from "./search.controller.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";

const router = Router();

// POST /api/search - Full semantic search
router.post("/", searchProducts);

// GET /api/search/quick?q=query - Quick autocomplete
router.get("/quick", quickSearchProducts);

// POST /api/search/image - Search by uploading an image
router.post("/image", uploadCloud.single("image"), searchByImage);

export default router;

