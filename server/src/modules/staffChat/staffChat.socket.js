import staffChatService from "./staffChat.service.js";

// Socket.IO handlers for staff chat
export function setupStaffChatSocket(io) {
  io.on("connection", (socket) => {
    // Join staff chat room
    socket.on("staffChat:join", ({ conversationIds, userId }) => {
      if (conversationIds && Array.isArray(conversationIds)) {
        conversationIds.forEach((convId) => {
          socket.join(`staffChat:${convId}`);
        });
      }
      if (userId) {
        socket.join(`staffUser:${userId}`);
      }
    });

    // Send message
    socket.on("staffChat:sendMessage", async ({ conversationId, senderId, content }) => {
      try {
        const message = await staffChatService.sendMessage(conversationId, senderId, content);
        // Broadcast to all in conversation
        io.to(`staffChat:${conversationId}`).emit("staffChat:newMessage", {
          conversationId,
          message,
        });
      } catch (error) {
        socket.emit("staffChat:error", { message: error.message });
      }
    });

    // Typing indicator
    socket.on("staffChat:typing", ({ conversationId, userId, userName, isTyping }) => {
      socket.to(`staffChat:${conversationId}`).emit("staffChat:userTyping", {
        conversationId,
        userId,
        userName,
        isTyping,
      });
    });

    // Mark as read
    socket.on("staffChat:markRead", async ({ conversationId, userId }) => {
      try {
        await staffChatService.markAsRead(conversationId, userId);
        io.to(`staffChat:${conversationId}`).emit("staffChat:messagesRead", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("staffChat:markRead error:", error);
      }
    });
  });
}
