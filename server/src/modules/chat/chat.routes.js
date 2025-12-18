import express from "express";
import { 
  checkHealth, 
  answerQuestion, 
  resetSession, 
  getSession,
  getChatHistory 
} from "./chat.controller.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

// Health check
router.get("/health", checkHealth);

// Get chat history (load on login/page load)
router.get("/history", optionalAuthMiddleware, getChatHistory);

// Main chat endpoint (supports both guests and authenticated users)
router.post("/chat", optionalAuthMiddleware, answerQuestion);

// Reset conversation session
router.post("/reset", optionalAuthMiddleware, resetSession);

// Get session info
router.get("/session/:sessionId", getSession);

export default router;