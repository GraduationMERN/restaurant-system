import ChatSession from "./ChatSession.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Conversation Manager
 * Handles session creation, message history, and state transitions
 */

/**
 * Get or create a chat session
 * @param {string} sessionId - Optional session ID (generated if not provided)
 * @param {string} participantId - Guest ID or User ID
 * @param {string} participantType - "guest" or "registered"
 * @param {string|null} userId - MongoDB User ID if registered
 */
export async function getOrCreateSession(sessionId, participantId, participantType = "guest", userId = null) {
  // Generate session ID if not provided
  const sid = sessionId || `session_${uuidv4()}`;
  
  let session = await ChatSession.findOne({ sessionId: sid });
  
  if (!session) {
    session = await ChatSession.create({
      sessionId: sid,
      participantId,
      participantType,
      user: userId,
      state: "greeting",
      messages: [],
      orderData: {},
    });
    console.log(`[ConversationManager] Created new session: ${sid}`);
  } else {
    console.log(`[ConversationManager] Found existing session: ${sid}, state: ${session.state}`);
  }
  
  return session;
}

/**
 * Add a message to the session
 * @param {string} sessionId 
 * @param {string} role - "user" | "assistant" | "tool"
 * @param {string} content 
 * @param {string|null} toolName 
 * @param {string|null} toolCallId 
 */
export async function addMessage(sessionId, role, content, toolName = null, toolCallId = null) {
  const session = await ChatSession.findOne({ sessionId });
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  session.messages.push({
    role,
    content,
    toolName,
    toolCallId,
    timestamp: new Date(),
  });
  
  await session.save();
  return session;
}

/**
 * Get recent messages with sliding window
 * @param {string} sessionId 
 * @param {number} limit - Number of recent messages to return
 */
export async function getRecentMessages(sessionId, limit = 10) {
  const session = await ChatSession.findOne({ sessionId });
  if (!session) {
    return [];
  }
  
  return session.messages.slice(-limit);
}

/**
 * Update session state
 * @param {string} sessionId 
 * @param {string} newState 
 */
export async function updateState(sessionId, newState) {
  const session = await ChatSession.findOneAndUpdate(
    { sessionId },
    { state: newState },
    { new: true }
  );
  
  if (session) {
    console.log(`[ConversationManager] State updated: ${sessionId} -> ${newState}`);
  }
  
  return session;
}

/**
 * Update order data collected during conversation
 * @param {string} sessionId 
 * @param {object} data - Partial order data to merge
 */
export async function updateOrderData(sessionId, data) {
  const session = await ChatSession.findOne({ sessionId });
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  // Merge order data
  Object.keys(data).forEach(key => {
    if (typeof data[key] === "object" && data[key] !== null && !Array.isArray(data[key])) {
      // Merge nested objects (like customerInfo, deliveryAddress)
      session.orderData[key] = {
        ...session.orderData[key],
        ...data[key],
      };
    } else {
      session.orderData[key] = data[key];
    }
  });
  
  session.markModified("orderData");
  await session.save();
  
  console.log(`[ConversationManager] Order data updated for: ${sessionId}`);
  return session;
}

/**
 * Get session by ID
 * @param {string} sessionId 
 */
export async function getSession(sessionId) {
  return await ChatSession.findOne({ sessionId });
}

/**
 * Get session with populated user
 * @param {string} sessionId 
 */
export async function getSessionWithUser(sessionId) {
  return await ChatSession.findOne({ sessionId }).populate("user", "name email phone");
}

/**
 * Link session to created order
 * @param {string} sessionId 
 * @param {string} orderId 
 */
export async function linkOrder(sessionId, orderId) {
  return await ChatSession.findOneAndUpdate(
    { sessionId },
    { orderId, state: "completed" },
    { new: true }
  );
}

/**
 * Clear/reset a session
 * @param {string} sessionId 
 */
export async function resetSession(sessionId) {
  const session = await ChatSession.findOne({ sessionId });
  if (!session) {
    return null;
  }
  
  session.state = "greeting";
  session.messages = [];
  session.orderData = {};
  session.orderId = null;
  
  await session.save();
  console.log(`[ConversationManager] Session reset: ${sessionId}`);
  return session;
}

/**
 * Delete expired sessions (can be called by cron job)
 */
export async function cleanupExpiredSessions() {
  const result = await ChatSession.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  
  if (result.deletedCount > 0) {
    console.log(`[ConversationManager] Cleaned up ${result.deletedCount} expired sessions`);
  }
  
  return result.deletedCount;
}

/**
 * Get all sessions for a participant
 * @param {string} participantId 
 */
export async function getSessionsByParticipant(participantId) {
  return await ChatSession.find({ participantId })
    .sort({ createdAt: -1 })
    .limit(10);
}

/**
 * Detect language from message (simple heuristic)
 * @param {string} message 
 */
export function detectLanguage(message) {
  // Check for Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(message) ? "ar" : "en";
}

/**
 * Update session language
 * @param {string} sessionId 
 * @param {string} language 
 */
export async function updateLanguage(sessionId, language) {
  return await ChatSession.findOneAndUpdate(
    { sessionId },
    { language },
    { new: true }
  );
}
