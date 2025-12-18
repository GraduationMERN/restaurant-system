import * as chatService from "./chat.service.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Health check endpoint
 */
export const checkHealth = (req, res) => {
  res.json({ 
    status: "ok", 
    service: "AI Chat Bot",
    time: new Date().toISOString() 
  });
};

/**
 * Main chat endpoint
 * Handles all AI chatbot interactions
 */
export const answerQuestion = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validate message
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid or empty message" 
      });
    }

    // Get participant info
    const isAuthenticated = Boolean(req.user?._id);
    const participantId = isAuthenticated 
      ? req.user._id.toString() 
      : req.headers["x-guest-id"] || req.cookies?.guestCartId || `guest_${uuidv4()}`;
    const participantType = isAuthenticated ? "registered" : "guest";
    const userId = isAuthenticated ? req.user._id : null;

    // Session ID based on user type for proper linking
    // Logged-in users: chat_user_{userId} - persists across sessions
    // Guests: chat_guest_{guestId} - persists via cookie
    const chatSessionId = sessionId || (isAuthenticated 
      ? `chat_user_${req.user._id}` 
      : `chat_guest_${participantId}`);

    console.log(`\n📝 Chat Request:`);
    console.log(`   Session: ${chatSessionId}`);
    console.log(`   Participant: ${participantId} (${participantType})`);
    console.log(`   Message: "${message.substring(0, 50)}..."`);

    // Process message
    const result = await chatService.processUserMessage(
      message,
      chatSessionId,
      participantId,
      participantType,
      userId
    );

    // If not authenticated, set guest ID cookie
    if (!isAuthenticated && !req.cookies?.guestCartId) {
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("guestCartId", participantId, {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/",
      });
    }

    // Return response
    res.json({
      success: result.success,
      answer: result.answer,
      sessionId: result.sessionId || chatSessionId,
      state: result.state,
      action: result.action,
      actionData: result.actionData,
    });

  } catch (error) {
    console.error("❌ Chat Controller Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "An error occurred processing your message" 
    });
  }
};

/**
 * Get chat history for current user/guest
 */
export const getChatHistory = async (req, res) => {
  try {
    const isAuthenticated = Boolean(req.user?._id);
    const participantId = isAuthenticated 
      ? req.user._id.toString() 
      : req.headers["x-guest-id"] || req.cookies?.guestCartId;

    if (!participantId) {
      return res.json({ success: true, messages: [], state: "greeting" });
    }

    const sessionId = isAuthenticated 
      ? `chat_user_${req.user._id}` 
      : `chat_guest_${participantId}`;

    const result = await chatService.getSessionInfo(sessionId);
    
    res.json({
      success: true,
      sessionId,
      messages: result.messages || [],
      state: result.state || "greeting",
    });

  } catch (error) {
    console.error("❌ Get Chat History Error:", error);
    res.json({ success: true, messages: [], state: "greeting" });
  }
};

/**
 * Reset conversation session
 */
export const resetSession = async (req, res) => {
  try {
    const isAuthenticated = Boolean(req.user?._id);
    const participantId = isAuthenticated 
      ? req.user._id.toString() 
      : req.headers["x-guest-id"] || req.cookies?.guestCartId;

    // Generate session ID the same way as in answerQuestion
    const sessionId = req.body.sessionId || (isAuthenticated 
      ? `chat_user_${req.user._id}` 
      : `chat_guest_${participantId}`);

    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: "Session ID is required" 
      });
    }

    const result = await chatService.resetConversation(sessionId);
    res.json(result);

  } catch (error) {
    console.error("❌ Reset Session Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to reset session" 
    });
  }
};

/**
 * Get session information
 */
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: "Session ID is required" 
      });
    }

    const result = await chatService.getSessionInfo(sessionId);
    res.json(result);

  } catch (error) {
    console.error("❌ Get Session Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get session info" 
    });
  }
};