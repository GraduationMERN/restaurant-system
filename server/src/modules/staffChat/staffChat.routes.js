import express from "express";
import * as staffChatController from "./staffChat.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";

const router = express.Router();

// Require staff role
const requireStaffRole = (req, res, next) => {
  const staffRoles = ["admin", "cashier", "kitchen"];
  if (!req.user || !staffRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Staff access only" });
  }
  next();
};

// All routes require auth + staff role
router.use(authMiddleware);
router.use(requireStaffRole);

// Routes
router.get("/staff-users", staffChatController.getStaffUsers);
router.get("/conversations", staffChatController.getConversations);
router.post("/conversations/private/:userId", staffChatController.getOrCreatePrivate);
router.get("/conversations/:id/messages", staffChatController.getMessages);
router.post("/conversations/:id/messages", staffChatController.sendMessage);
router.put("/conversations/:id/read", staffChatController.markAsRead);
router.delete("/conversations/:id", staffChatController.deleteConversation);

// Upload route
router.post("/upload", uploadCloud.single("file"), staffChatController.uploadAttachment);

export default router;
