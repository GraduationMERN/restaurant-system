import express from "express";
import {
  forgetPasswordController,
  googleCallbackController,
  loginUserController,
  logoutController,
  refreshTokenController,
  registerUserController,
  resetPasswordController,
  verifyOTP,
} from "../controller/auth.controller.js";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import { getMe } from "../controller/auth.controller.js";
import validatePassword from "../../../middlewares/validatePassword.middleware.js";
import { env } from "../../../config/env.js";

const router = express.Router();

router.post("/register", validatePassword, registerUserController);
router.post("/verifyOtp", verifyOTP);
router.post("/login", loginUserController);
router.get("/me", authMiddleware, getMe);
router.post("/refresh", refreshTokenController);
router.post("/forget", forgetPasswordController);
router.post("/reset", validatePassword, resetPasswordController);
router.get("/google", (req, res) => {
  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: env.googleId,
      redirect_uri: env.serverURI,
      response_type: "code",
      scope: "openid email profile",
      prompt: "consent",
    });

  res.redirect(redirectUrl);
});
router.get("/google/callback", googleCallbackController);
router.post("/logout", logoutController);

export default router;
