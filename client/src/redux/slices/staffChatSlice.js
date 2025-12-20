import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ============ Async Thunks ============

export const fetchStaffUsers = createAsyncThunk(
  "staffChat/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/staff-chat/staff-users");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
    }
  }
);

export const fetchConversations = createAsyncThunk(
  "staffChat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/staff-chat/conversations");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch conversations");
    }
  }
);

export const getOrCreatePrivateChat = createAsyncThunk(
  "staffChat/getOrCreatePrivateChat",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/staff-chat/conversations/private/${userId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create chat");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "staffChat/fetchMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/staff-chat/conversations/${conversationId}/messages`);
      return { conversationId, messages: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch messages");
    }
  }
);

export const sendMessage = createAsyncThunk(
  "staffChat/sendMessage",
  async ({ conversationId, content }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/staff-chat/conversations/${conversationId}/messages`, { content });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to send message");
    }
  }
);

export const markAsRead = createAsyncThunk(
  "staffChat/markAsRead",
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.put(`/api/staff-chat/conversations/${conversationId}/read`);
      return conversationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to mark as read");
    }
  }
);

export const deleteConversation = createAsyncThunk(
  "staffChat/deleteConversation",
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/staff-chat/conversations/${conversationId}`);
      return conversationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete conversation");
    }
  }
);

export const uploadAttachment = createAsyncThunk(
  "staffChat/uploadAttachment",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/staff-chat/upload", formData);
      return res.data.url;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Upload failed");
    }
  }
);

// ============ Slice ============

const staffChatSlice = createSlice({
  name: "staffChat",
  initialState: {
    staffUsers: [],
    conversations: [],
    activeConversation: null,
    messages: [],
    loading: false,
    messagesLoading: false,
    typingUsers: {}, // { conversationId: [{userId, userName}, ...] }
    error: null,
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      // Also mark as read in local state
      const conv = state.conversations.find((c) => c._id === action.payload._id);
      if (conv) {
        conv.unreadCount = 0;
      }
    },
    clearActiveConversation: (state) => {
      state.activeConversation = null;
      state.messages = [];
    },
    receiveNewMessage: (state, action) => {
      const { conversationId, message, isChatOpen } = action.payload;
      // Active means: selected in Redux AND the chat window is open
      // If isChatOpen is not provided, we assume true if activeConversation matches (backward compatibility),
      // but strictly speaking, the UI should provide it.
      // If the chat is closed (isChatOpen === false), we treat it as inactive so unread count increments.
      const isActiveConversation = state.activeConversation?._id === conversationId && (isChatOpen !== false);
      
      if (isActiveConversation) {
        const exists = state.messages.find((m) => m._id === message._id);
        if (!exists) {
          state.messages.push(message);
        }
      }
      
      // Update conversation's last message and unread count, and move to top
      const convIndex = state.conversations.findIndex((c) => c._id === conversationId);
      if (convIndex !== -1) {
        // Clone the conversation to avoid proxy issues and ensure state immutability
        const existingConv = state.conversations[convIndex];
        
        const updatedConv = {
          ...existingConv,
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            senderName: message.senderName,
            timestamp: message.createdAt,
          },
          // Update unread count if not viewing this conversation
          unreadCount: (!isActiveConversation) 
            ? (existingConv.unreadCount || 0) + 1 
            : (existingConv.unreadCount || 0),
          // Update timestamp to ensure sort order if needed
          updatedAt: message.createdAt || new Date().toISOString()
        };

        // Remove from old position and add to top
        state.conversations.splice(convIndex, 1);
        state.conversations.unshift(updatedConv);
      }
    },
    setTyping: (state, action) => {
      const { conversationId, userId, userName, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      
      if (isTyping) {
        const exists = state.typingUsers[conversationId].find((u) => u.userId === userId);
        if (!exists) {
          state.typingUsers[conversationId].push({ userId, userName });
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          (u) => u.userId !== userId
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchStaffUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStaffUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.staffUsers = action.payload;
      })
      .addCase(fetchStaffUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Conversations
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      })
      
      // Get/Create Private Chat
      .addCase(getOrCreatePrivateChat.fulfilled, (state, action) => {
        // Add to conversations if not exists
        const exists = state.conversations.find((c) => c._id === action.payload._id);
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
      })
      
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload.messages;
      })
      
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload.message || action.payload;
        const exists = state.messages.find((m) => m._id === msg._id);
        if (!exists) {
          state.messages.push(msg);
        }

        const conversationId = action.meta.arg.conversationId;
        const convIndex = state.conversations.findIndex((c) => c._id === conversationId);
        if (convIndex !== -1) {
          // Clone and update conversation
          const existingConv = state.conversations[convIndex];
          const updatedConv = {
            ...existingConv,
            lastMessage: {
              content: msg.content,
              senderId: msg.senderId,
              senderName: msg.senderName,
              timestamp: msg.createdAt,
            },
            updatedAt: msg.createdAt || new Date().toISOString()
          };

          state.conversations.splice(convIndex, 1);
          state.conversations.unshift(updatedConv);
        }
      })
      
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const conv = state.conversations.find((c) => c._id === conversationId);
        if (conv) {
          conv.unreadCount = 0;
        }
      })

      // Delete Conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(c => c._id !== action.payload);
        if (state.activeConversation?._id === action.payload) {
          state.activeConversation = null;
          state.messages = [];
        }
      });
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  receiveNewMessage,
  setTyping,
} = staffChatSlice.actions;

export default staffChatSlice.reducer;
