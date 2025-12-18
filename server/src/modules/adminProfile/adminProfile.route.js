import express from "express";
import { getProfile, updateProfile, uploadAvatar } from "./adminProfile.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";

const router = express.Router();

// All routes require authentication (any role)
router.use(authMiddleware);

// GET /api/user-profile - Get current user's profile
router.get("/", getProfile);

// PUT /api/user-profile - Update user profile
router.put("/", updateProfile);

// POST /api/user-profile/avatar - Upload user avatar
router.post("/avatar", uploadCloud.single("avatar"), uploadAvatar);

export default router;
