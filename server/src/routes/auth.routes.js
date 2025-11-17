import express from "express";
import {
  loginUserController,
  refreshTokenController,
  registerUserController,
  verifyOTP,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getMe } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/verifyOtp", verifyOTP);
router.post("/login", loginUserController);
router.get("/me", authMiddleware, getMe);
router.post("/refresh", refreshTokenController);

export default router;
