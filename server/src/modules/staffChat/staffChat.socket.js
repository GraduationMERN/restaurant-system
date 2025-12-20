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
        const { message, conversation } = await staffChatService.sendMessage(conversationId, senderId, content);
        
        // Broadcast to conversation room (for open chats)
        io.to(`staffChat:${conversationId}`).emit("staffChat:newMessage", {
          conversationId,
          message,
        });

        // Broadcast to participants' personal rooms (for notifications/updates)
        if (conversation && conversation.participants) {
          const notifiedUsers = new Set();
          conversation.participants.forEach((p) => {
            const pId = (p.userId._id || p.userId).toString();
            if (!notifiedUsers.has(pId)) {
              io.to(`staffUser:${pId}`).emit("staffChat:newMessage", {
                conversationId,
                message,
              });
              notifiedUsers.add(pId);
            }
          });
        }
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
