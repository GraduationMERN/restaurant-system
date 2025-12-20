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
    error: null,
    typingUsers: {},
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      state.messages = [];
    },
    clearActiveConversation: (state) => {
      state.activeConversation = null;
      state.messages = [];
    },
    addLocalMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    receiveNewMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      const isActiveConversation = state.activeConversation?._id === conversationId;
      
      if (isActiveConversation) {
        // Avoid duplicates
        const exists = state.messages.find((m) => m._id === message._id);
        if (!exists) {
          state.messages.push(message);
        }
      }
      
      // Update conversation's last message and unread count
      const conv = state.conversations.find((c) => c._id === conversationId);
      if (conv) {
        conv.lastMessage = {
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName,
          timestamp: message.createdAt,
        };
        // Increment unread count if not viewing this conversation
        if (!isActiveConversation) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
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
      // Fetch staff users
      .addCase(fetchStaffUsers.fulfilled, (state, action) => {
        state.staffUsers = action.payload;
      })
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get or create private chat
      .addCase(getOrCreatePrivateChat.fulfilled, (state, action) => {
        const exists = state.conversations.find((c) => c._id === action.payload._id);
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        const exists = state.messages.find((m) => m._id === msg._id);
        if (!exists) {
          state.messages.push(msg);
        }
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const conv = state.conversations.find((c) => c._id === conversationId);
        if (conv) {
          conv.unreadCount = 0;
        }
      });
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  addLocalMessage,
  receiveNewMessage,
  setTyping,
} = staffChatSlice.actions;

export default staffChatSlice.reducer;
