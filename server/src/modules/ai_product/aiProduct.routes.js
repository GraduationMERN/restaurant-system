import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";
import { analyzeImage } from "./aiProduct.controller.js";

const router = express.Router();

router.post(
  "/analyze-image",
  authMiddleware,
  roleMiddleware("admin"),
  uploadCloud.single("image"),
  analyzeImage
);

export default router;

