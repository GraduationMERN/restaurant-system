import express from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import { completeProfileController, getMeController, logoutController, refreshTokenController, startAuthController, verifyOTPController } from "../controller/auth.controller.js";
import { egyptianPhoneValidator } from "../../../validators/phone.validator.js";
import { validate } from "../../../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/start",egyptianPhoneValidator,validate,startAuthController);
router.post("/verify", egyptianPhoneValidator,body("otp").isLength({ min: 4, max: 6 }),validate, verifyOTPController);
router.post("/complete-profile", completeProfileController);
router.get("/me", authMiddleware, getMeController);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);

export default router;
