import express from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import { completeProfileController, getMeController, logoutController, refreshTokenController,firebaseLoginController } from "../controller/auth.controller.js";

const router = express.Router();
router.post("/firebase-login", firebaseLoginController);
router.post("/complete-profile",authMiddleware, completeProfileController);
router.get("/me", authMiddleware, getMeController);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);

export default router;
