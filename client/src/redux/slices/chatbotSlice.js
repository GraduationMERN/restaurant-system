import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const checkChatbotHealth = createAsyncThunk(
  "chatbot/health",
  async () => {
    const res = await api.get("/api/chatBot/health");
    return res.data;
  }
);

export const sendChatMessage = createAsyncThunk(
  "chatbot/send",
  async (message) => {
    const res = await api.post("/api/chatBot/chat", { message });
    return res.data;
  }
);

const initialSuggestions = {
  initial: [
    { text: "Show menu", query: "What items do you have on the menu?" },
    { text: "Vegetarian options", query: "What vegetarian options do you have?" },
    { text: "Desserts", query: "What desserts do you have?" },
    { text: "Popular items", query: "What are your most popular items?" },
  ],
  followup: [
    { text: "Any specials?", query: "Do you have any specials today?" },
    { text: "Dietary options", query: "What dietary options do you offer?" },
    { text: "Price range", query: "What's your price range?" },
    { text: "Spicy dishes", query: "Do you have spicy dishes?" },
  ],
};

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState: {
    isActive: false,
    isWaiting: false,
    messages: [
      {
        type: "bot",
        content:
          "Hello! 👋 I'm your AI-powered restaurant assistant. I can help you explore our menu, find dishes that match your preferences, and answer any questions you have!",
        time: new Date().toISOString(),
      },
    ],
    suggestions: initialSuggestions.initial,
    relevantItems: [],
    backendStatus: "unknown",
    error: null,
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
    setFollowupSuggestions(state) {
      state.suggestions = initialSuggestions.followup;
    },
    clearRelevantItems(state) {
      state.relevantItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkChatbotHealth.fulfilled, (state, action) => {
        const data = action.payload || {};
        state.backendStatus = data.status === "ok" ? "ok" : "down";
      })
      .addCase(checkChatbotHealth.rejected, (state) => {
        state.backendStatus = "down";
      })
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
          state.relevantItems = Array.isArray(data.relevantItems)
            ? data.relevantItems
            : [];
          state.suggestions = initialSuggestions.followup;
        } else {
          state.messages.push({
            type: "bot",
            content:
              data.answer || "Sorry, I encountered an error. Please try again.",
            time: new Date().toISOString(),
          });
          state.suggestions = initialSuggestions.initial;
        }
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.isWaiting = false;
        state.messages.push({
          type: "bot",
          content:
            "Sorry, I'm having trouble connecting to the server. Please check if the backend is running.",
          time: new Date().toISOString(),
        });
        state.suggestions = initialSuggestions.initial;
      });
  },
});

export const {
  toggleChatbot,
  addLocalMessage,
  clearSuggestions,
  setInitialSuggestions,
  setFollowupSuggestions,
  clearRelevantItems,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;

