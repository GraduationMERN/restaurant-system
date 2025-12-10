import { Router } from "express";
import {
  getAllNotifications,
  markAsRead,
} from "./notification.controller.js";
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getUserSubscriptions
} from "./subscription.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getAllNotifications);
router.patch("/:id/read", markAsRead);

// Push notification subscription routes
router.post("/subscribe", authMiddleware, subscribeToNotifications);
router.post("/unsubscribe", authMiddleware, unsubscribeFromNotifications);
router.get("/subscriptions", authMiddleware, getUserSubscriptions);

export default router;
