import mongoose from "mongoose";

/**
 * Chat Session Model
 * Stores conversation history and state for AI chatbot
 */

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system", "tool"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  toolName: {
    type: String,
    default: null,
  },
  toolCallId: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema(
  {
    // Session identifier (can be generated or from frontend)
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Guest ID or User ID
    participantId: {
      type: String,
      required: true,
      index: true,
    },

    // Whether participant is registered user or guest
    participantType: {
      type: String,
      enum: ["guest", "registered"],
      default: "guest",
    },

    // Reference to User if registered
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Conversation state for order flow
    state: {
      type: String,
      enum: [
        "greeting",      // Initial state
        "browsing",      // Looking at menu/info
        "ordering",      // Adding items to cart
        "cart_review",   // Reviewing cart
        "service_type",  // Selecting dine-in/pickup/delivery
        "delivery_info", // Collecting delivery address
        "table_info",    // Collecting table number
        "coupon",        // Applying coupon
        "order_summary", // Final review before payment
        "payment",       // Payment selection
        "completed",     // Order completed
      ],
      default: "greeting",
    },

    // Messages history (will be trimmed to last N messages)
    messages: [messageSchema],

    // Collected order data during conversation
    orderData: {
      serviceType: {
        type: String,
        enum: ["dine-in", "pickup", "delivery", null],
        default: null,
      },
      tableNumber: {
        type: String,
        default: null,
      },
      deliveryAddress: {
        address: { type: String, default: null },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        notes: { type: String, default: null },
      },
      couponCode: {
        type: String,
        default: null,
      },
      customerInfo: {
        name: { type: String, default: null },
        phone: { type: String, default: null },
        email: { type: String, default: null },
      },
      paymentMethod: {
        type: String,
        enum: ["online", "instore", null],
        default: null,
      },
    },

    // Created order reference
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Language preference detected from conversation
    language: {
      type: String,
      enum: ["ar", "en"],
      default: "ar",
    },

    // Session expiry (auto-cleanup)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding sessions by participant
chatSessionSchema.index({ participantId: 1, createdAt: -1 });

// Static method to get or create session
chatSessionSchema.statics.getOrCreate = async function (sessionId, participantId, participantType = "guest", user = null) {
  let session = await this.findOne({ sessionId });
  
  if (!session) {
    session = await this.create({
      sessionId,
      participantId,
      participantType,
      user,
      state: "greeting",
      messages: [],
      orderData: {},
    });
  }
  
  return session;
};

// Instance method to add message
chatSessionSchema.methods.addMessage = function (role, content, toolName = null, toolCallId = null) {
  this.messages.push({
    role,
    content,
    toolName,
    toolCallId,
    timestamp: new Date(),
  });
  return this.save();
};

// Instance method to get recent messages (sliding window)
chatSessionSchema.methods.getRecentMessages = function (limit = 10) {
  const messages = this.messages.slice(-limit);
  return messages;
};

// Instance method to update state
chatSessionSchema.methods.updateState = function (newState) {
  this.state = newState;
  return this.save();
};

// Instance method to update order data
chatSessionSchema.methods.updateOrderData = function (data) {
  Object.assign(this.orderData, data);
  this.markModified("orderData");
  return this.save();
};

// Instance method to clear session (start fresh)
chatSessionSchema.methods.reset = function () {
  this.state = "greeting";
  this.messages = [];
  this.orderData = {};
  this.orderId = null;
  return this.save();
};

export default mongoose.model("ChatSession", chatSessionSchema);
