import express from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import roleMiddleware from "../../../middlewares/role.middleware.js";
import { getAllUsers, getUserById } from "../controller/users.controller.js";

const router = express.Router();

// router.get("/", authMiddleware,roleMiddleware("admin"),getAllUsers); should be active later
router.get("/", getAllUsers);
router.get("/:id", getUserById);
// router.get("/:id", authMiddleware,getUserById);

export default router;
