import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios"; // Your existing axios instance
import { v4 as uuidv4 } from "uuid"; // You need to install this: npm install uuid

// --- Helper: Manage Guest ID ---
const getGuestId = () => {
  // Check if ID exists in local storage, if not, create one
  let id = localStorage.getItem("guest_session_id");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("guest_session_id", id);
  }
  return id;
};

// --- Helper: Extract Product Data from AI Response ---
// The AI sends a text like: "- Product: Burger | Price: 100... ![img](url)"
// We parse this to create the 'relevantItems' cards for your UI.
const parseProductsFromText = (text) => {
  const items = [];
  if (!text) return items;

  // Split response by logical blocks (items usually separated by newlines or markers)
  // Our backend uses "---" or distinct bullet points.
  const blocks = text.split(/(?=- Product:)/i);

  blocks.forEach((block) => {
    // Regex to extract details based on the format defined in aiTools.js
    const nameMatch = block.match(/Product:\s*(.*?)(?:\n|\||$)/i);
    const priceMatch = block.match(/Price:\s*(\d+)/i);
    const imgMatch = block.match(/!\[.*?\]\((.*?)\)/); // Extracts URL from Markdown image

    if (nameMatch && priceMatch) {
      items.push({
        name: nameMatch[1].replace(/\(.*\)/, "").trim(), // Remove Arabic name for cleaner UI card
        price: priceMatch[1],
        img: imgMatch ? imgMatch[1] : null, // If image exists
      });
    }
  });

  return items;
};

// --- Async Thunks ---

export const checkChatbotHealth = createAsyncThunk(
  "chatbot/health",
  async () => {
    // Adjusted endpoint to match standard convention, or keep yours
    const res = await api.get("/api/chatBot/health");
    return res.data;
  }
);

export const sendChatMessage = createAsyncThunk(
  "chatbot/send",
  async (message, { rejectWithValue }) => {
    try {
      const guestId = getGuestId();

      // Sending Guest ID is crucial for the 'create_order' tool to work
      const res = await api.post(
        "/api/chatBot/chat", // Ensure this matches your server.js route
        { message },
        { headers: { "x-guest-id": guestId } }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error connecting to AI");
    }
  }
);

// --- Suggestions Configuration ---
const initialSuggestions = {
  initial: [
    { text: "🍕 Show me pizzas", query: "What pizzas do you have?" },
    { text: "🥗 Vegetarian options", query: "Do you have vegetarian food?" },
    { text: "🍰 Best desserts", query: "Show me desserts with pictures" },
    { text: "🧾 My Order", query: "Track my order status" }, // Added tracking
  ],
  followup: [
    { text: "💰 Any deals?", query: "Do you have any special offers?" },
    { text: "🌶️ Spicy options", query: "I like spicy food" },
    { text: "✅ Confirm Order", query: "Yes, please confirm the order" }, // Helpful for closing deals
    { text: "🥤 Drinks", query: "What drinks do you have?" },
  ],
};

// --- Slice ---
const chatbotSlice = createSlice({
  name: "chatbot",
  initialState: {
    isActive: false,
    isWaiting: false,
    messages: [
      {
        type: "bot",
        content: "Hello! 👋 I'm TastyBot. I can show you the menu, pictures of food, and take your order directly here!",
        time: new Date().toISOString(),
      },
    ],
    suggestions: initialSuggestions.initial,
    relevantItems: [], // Populated dynamically from AI response
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
      // Health Check
      .addCase(checkChatbotHealth.fulfilled, (state, action) => {
        state.backendStatus = action.payload?.status === "ok" ? "ok" : "down";
      })
      .addCase(checkChatbotHealth.rejected, (state) => {
        state.backendStatus = "down";
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
          // 1. Add Bot Response
          state.messages.push({
            type: "bot",
            content: data.answer,
            time: new Date().toISOString(),
          });

          // 2. Smart Parsing: Extract products for the UI Cards
          // The backend sends a text string; we extract JSON-like data for the cards
          const extractedItems = parseProductsFromText(data.answer);

          if (extractedItems.length > 0) {
            state.relevantItems = extractedItems;
            state.suggestions = initialSuggestions.followup;
          } else {
            // Keep previous items or clear? Usually clear if context changes
            // state.relevantItems = []; 
          }

          // 3. Action Handling
          if (data.action === "create_order") {
            // You could trigger a UI confetti or sound effect here via state
            state.suggestions = [{ text: "Track Order", query: "Track my order" }];
          }

        } else {
          // Handle Logic Error from Backend
          state.messages.push({
            type: "bot",
            content: data.answer || "Sorry, I couldn't understand that.",
            time: new Date().toISOString(),
          });
        }
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.isWaiting = false;
        state.messages.push({
          type: "bot",
          content: "😔 Connection lost. Please try again later.",
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