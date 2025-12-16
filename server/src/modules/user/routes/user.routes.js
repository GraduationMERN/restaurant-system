import express from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import roleMiddleware from "../../../middlewares/role.middleware.js";
import { getAllUsers, getUserById, updateMe, updateMyAvatar } from "../controller/users.controller.js";
import { uploadCloud } from "../../../middlewares/uploadCloudinary.middleware.js";

const router = express.Router();

// router.get("/", authMiddleware,roleMiddleware("admin"),getAllUsers); should be active later
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/me", authMiddleware, updateMe);
router.post("/me/avatar", authMiddleware, uploadCloud.single("avatar"), updateMyAvatar);
// router.get("/:id", authMiddleware,getUserById);

export default router;
