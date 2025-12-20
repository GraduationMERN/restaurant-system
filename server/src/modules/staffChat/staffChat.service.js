import { StaffConversation, StaffMessage } from "./staffChat.model.js";
import User from "../user/model/User.js";
import mongoose from "mongoose";

class StaffChatService {
  // Get all staff users
  async getStaffUsers() {
    return User.find({
      role: { $in: ["admin", "cashier", "kitchen"] },
    })
      .select("_id name email role avatarUrl")
      .lean();
  }

  // Get or create private conversation between two users
  async getOrCreatePrivateConversation(userId1, userId2) {
    // Convert to ObjectId for proper comparison
    const id1 = new mongoose.Types.ObjectId(userId1);
    const id2 = new mongoose.Types.ObjectId(userId2);

    // Find existing conversation
    let query;
    if (id1.equals(id2)) {
      // Self-chat: find conversation with exactly 2 participants, both being this user
      query = {
        type: "private",
        "participants": { 
          $size: 2,
          $not: { $elemMatch: { "userId": { $ne: id1 } } }
        }
      };
    } else {
      // Chat between two different users
      query = {
        type: "private",
        $and: [
          { "participants.userId": id1 },
          { "participants.userId": id2 }
        ],
        "participants": { $size: 2 }
      };
    }

    let conversation = await StaffConversation.findOne(query).populate("participants.userId", "name avatarUrl role");

    if (!conversation) {
      // Get user details
      const [user1, user2] = await Promise.all([
        User.findById(id1).select("name role avatarUrl"),
        User.findById(id2).select("name role avatarUrl"),
      ]);

      if (!user1 || !user2) {
        throw new Error("User not found");
      }

      conversation = await StaffConversation.create({
        type: "private",
        participants: [
          { userId: id1, role: user1.role },
          { userId: id2, role: user2.role },
        ],
      });

      conversation = await StaffConversation.findById(conversation._id).populate(
        "participants.userId",
        "name avatarUrl role"
      );
    }

    return conversation;
  }

  // Get user's conversations with unread counts
  async getConversationsForUser(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const conversations = await StaffConversation.find({
      "participants.userId": userObjectId,
    })
      .populate("participants.userId", "name avatarUrl role")
      .sort({ "lastMessage.timestamp": -1, updatedAt: -1 })
      .lean();

    // Filter out self-conversations (where all participants are the current user)
    // In a self-chat with 2 participants, both have the same userId.
    const validConversations = conversations.filter(conv => {
       // Keep conversation only if there is at least one participant who is NOT the current user
       return conv.participants.some(p => {
         const pId = p.userId._id || p.userId; // handle populated or unpopulated
         return pId.toString() !== userId.toString();
       });
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      validConversations.map(async (conv) => {
        const unreadCount = await StaffMessage.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userObjectId },
          "readBy.userId": { $ne: userObjectId },
        });
        return { ...conv, unreadCount };
      })
    );

    return conversationsWithUnread;
  }

  // Send message
  async sendMessage(conversationId, senderId, content) {
    const sender = await User.findById(senderId).select("name role");
    if (!sender) throw new Error("Sender not found");

    // Verify sender is participant
    const conversation = await StaffConversation.findOne({
      _id: conversationId,
      "participants.userId": senderId,
    });
    if (!conversation) throw new Error("Access denied");

    // Create message
    const message = await StaffMessage.create({
      conversationId,
      senderId,
      senderName: sender.name,
      senderRole: sender.role,
      content,
      readBy: [{ userId: senderId }],
    });

    // Update conversation's last message
    const updatedConversation = await StaffConversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content,
        senderId,
        senderName: sender.name,
        timestamp: new Date(),
      },
    }, { new: true }).populate("participants.userId", "name avatarUrl role");

    return { message, conversation: updatedConversation };
  }

  // Get messages for a conversation
  async getMessages(conversationId, userId, limit = 50) {
    // Verify access
    const conversation = await StaffConversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });
    if (!conversation) throw new Error("Access denied");

    return StaffMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    return StaffMessage.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        "readBy.userId": { $ne: userId },
      },
      { $push: { readBy: { userId, readAt: new Date() } } }
    );
  }

  // Delete conversation
  async deleteConversation(conversationId, userId) {
    // Verify access
    const conversation = await StaffConversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });
    
    if (!conversation) {
      throw new Error("Conversation not found or access denied");
    }

    // Delete messages first
    await StaffMessage.deleteMany({ conversationId });
    
    // Delete conversation
    await StaffConversation.findByIdAndDelete(conversationId);
    
    return true;
  }
}

export default new StaffChatService();
