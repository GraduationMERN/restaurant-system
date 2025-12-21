import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// --- Async Thunks ---

export const checkChatbotHealth = createAsyncThunk(
  "chatbot/health",
  async () => {
    const res = await api.get("/api/chatBot/health");
    return res.data;
  }
);

export const loadChatHistory = createAsyncThunk(
  "chatbot/loadHistory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/chatBot/history");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to load history");
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "chatbot/send",
  async (message, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/chatBot/chat", { message });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error connecting to AI");
    }
  }
);

export const resetChatSession = createAsyncThunk(
  "chatbot/reset",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/chatBot/reset", {});
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error resetting session");
    }
  }
);

// --- Suggestions Configuration (English Only) ---
const initialSuggestions = {
  initial: [
    { text: "📋 View Menu", query: "Show me the menu" },
    { text: "🍔 Order Food", query: "I want to order food" },
    { text: "🛒 My Cart", query: "What's in my cart?" },
    { text: "❓ Help", query: "How do I order?" },
  ],
  ordering: [
    { text: "➕ Add More", query: "I want something else" },
    { text: "🛒 View Cart", query: "Show my cart" },
    { text: "✅ Done", query: "I'm done" },
  ],
  checkout: [
    { text: "🏠 Delivery", query: "Delivery" },
    { text: "🏪 Pickup", query: "Pickup" },
    { text: "🪑 Dine-in", query: "Dine-in" },
  ],
  coupon: [
    { text: "✅ No Coupon", query: "No, I don't have a coupon" },
    { text: "🎫 I Have a Coupon", query: "I have a coupon" },
  ],
  payment: [
    { text: "💳 Pay Online", query: "Pay online" },
    { text: "💵 Pay at Counter", query: "Pay at counter" },
  ],
  completed: [
    { text: "🆕 New Order", query: "I want to order again" },
    { text: "📞 Contact Support", query: "I need help" },
  ],
};

// --- Get suggestions based on state ---
const getSuggestionsForState = (state) => {
  switch (state) {
    case "greeting":
    case "browsing":
      return initialSuggestions.initial;
    case "ordering":
    case "cart_review":
      return initialSuggestions.ordering;
    case "service_type":
    case "delivery_info":
    case "table_info":
      return initialSuggestions.checkout;
    case "coupon":
    case "order_summary":
      return initialSuggestions.coupon;
    case "payment":
      return initialSuggestions.payment;
    case "completed":
      return initialSuggestions.completed;
    default:
      return initialSuggestions.initial;
  }
};

// --- Slice ---
const chatbotSlice = createSlice({
  name: "chatbot",
  initialState: {
    isActive: false,
    isWaiting: false,
    isLoaded: false,
    messages: [],
    suggestions: initialSuggestions.initial,
    backendStatus: "unknown",
    error: null,
    sessionId: null,
    conversationState: "greeting",
    lastAction: null,
    restaurantInfo: null,
  },
  reducers: {
    toggleChatbot(state) {
      state.isActive = !state.isActive;
    },
    addLocalMessage(state, action) {
      state.messages.push(action.payload);
    },
    clearSuggestions(state) {
      state.suggestions = [];
    },
    setInitialSuggestions(state) {
      state.suggestions = initialSuggestions.initial;
    },
    clearChat(state) {
      state.messages = [];
      state.suggestions = initialSuggestions.initial;
      state.conversationState = "greeting";
      state.lastAction = null;
      state.isLoaded = false;
      state.sessionId = null;
    },
    setRestaurantInfo(state, action) {
      state.restaurantInfo = action.payload;
    },
    setWelcomeMessage(state, action) {
      const restaurantName = action.payload || "Our Restaurant";
      if (state.messages.length === 0) {
        state.messages = [
          {
            type: "bot",
            content: `Welcome to **${restaurantName}**! 👋\n\n🍽️ What would you like to order today?`,
            time: new Date().toISOString(),
          },
        ];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Health Check
      .addCase(checkChatbotHealth.fulfilled, (state, action) => {
        state.backendStatus = action.payload?.status === "ok" ? "ok" : "down";
      })
      .addCase(checkChatbotHealth.rejected, (state) => {
        state.backendStatus = "down";
      })

      // Load Chat History
      .addCase(loadChatHistory.pending, (state) => {
        state.isWaiting = true;
      })
      .addCase(loadChatHistory.fulfilled, (state, action) => {
        state.isWaiting = false;
        state.isLoaded = true;
        const data = action.payload || {};
        
        if (data.success && data.messages && data.messages.length > 0) {
          state.messages = data.messages;
          state.conversationState = data.state || "greeting";
          state.sessionId = data.sessionId;
          state.suggestions = getSuggestionsForState(data.state);
        }
      })
      .addCase(loadChatHistory.rejected, (state) => {
        state.isWaiting = false;
        state.isLoaded = true;
      })

      // Send Message
      .addCase(sendChatMessage.pending, (state) => {
        state.isWaiting = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isWaiting = false;
        const data = action.payload || {};

        if (data.success) {
          state.messages.push({
            type: "bot",
            content: data.answer,
            time: new Date().toISOString(),
          });

          if (data.sessionId) {
            state.sessionId = data.sessionId;
          }

          if (data.state) {
            state.conversationState = data.state;
            state.suggestions = getSuggestionsForState(data.state);
          }

          if (data.action) {
            state.lastAction = data.action;

            if (data.action === "order_created") {
              state.suggestions = [
                { text: "📦 Track Order", query: "Where's my order?" },
                { text: "🆕 New Order", query: "I want to order again" },
              ];
            }

            if (data.action === "payment_redirect" && data.actionData?.checkoutUrl) {
              window.open(data.actionData.checkoutUrl, "_blank");
            }
          }
        } else {
          state.messages.push({
            type: "bot",
            content: data.answer || "Sorry, something went wrong. Please try again.",
            time: new Date().toISOString(),
          });
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isWaiting = false;
        state.error = action.payload;
        state.messages.push({
          type: "bot",
          content: "😔 Connection error. Please try again later.",
          time: new Date().toISOString(),
        });
        state.suggestions = initialSuggestions.initial;
      })

      // Reset Session
      .addCase(resetChatSession.fulfilled, (state) => {
        state.messages = [];
        state.suggestions = initialSuggestions.initial;
        state.sessionId = null;
        state.conversationState = "greeting";
        state.isLoaded = false; // This will trigger welcome message when chat is active
      });
  },
});

export const {
  toggleChatbot,
  addLocalMessage,
  clearSuggestions,
  setInitialSuggestions,
  clearChat,
  setRestaurantInfo,
  setWelcomeMessage,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;