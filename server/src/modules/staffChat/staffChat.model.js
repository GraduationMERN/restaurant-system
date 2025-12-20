import mongoose from "mongoose";

// ============================================================
// STAFF CONVERSATION SCHEMA
// ============================================================
const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      default: "private",
    },
    name: {
      type: String,
      default: null,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "cashier", "kitchen"],
        },
      },
    ],
    lastMessage: {
      content: String,
      senderId: mongoose.Schema.Types.ObjectId,
      senderName: String,
      timestamp: Date,
    },
  },
  { timestamps: true }
);

// ============================================================
// STAFF MESSAGE SCHEMA
// ============================================================
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffConversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["admin", "cashier", "kitchen"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    readBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const StaffConversation = mongoose.model("StaffConversation", conversationSchema);
export const StaffMessage = mongoose.model("StaffMessage", messageSchema);
