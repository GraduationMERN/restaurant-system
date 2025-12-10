import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByOrder,
  getReviewsByUser,
} from "./review.controller.js";

import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllReviews);
router.get("/:id", getReviewById);
router.get("/order/:orderId", getReviewsByOrder);
router.get("/user/:userId", getReviewsByUser);

// Protected routes
router.post("/",optionalAuthMiddleware,  uploadCloud.array("photos", 3), createReview);
router.put("/:id",  updateReview);
router.delete("/:id", deleteReview);

export default router;
