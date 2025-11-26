import { Router } from "express";
import {
  getAllNotifications,
  markAsRead,
} from "./notification.controller.js";

const router = Router();

router.get("/", getAllNotifications);
router.patch("/:id/read", markAsRead);

export default router;
