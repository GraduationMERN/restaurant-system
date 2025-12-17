import { chatModel } from "../../config/ai.js";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import * as conversationManager from "./conversationManager.js";
import {
  allTools,
  greetingTools,
  browsingTools,
  orderingTools,
  checkoutTools,
  paymentTools,
} from "./aiTools.js";
import Cart from "../cart/Cart.js";
import Category from "../category/Category.js";
import Restaurant from "../restaurant/restaurant.model.js";

// ============================================================
// CACHING - Reduce database calls
// ============================================================
let restaurantCache = { data: null, expires: 0 };
let categoriesCache = { data: null, expires: 0 };

async function getCachedRestaurant() {
  if (Date.now() < restaurantCache.expires && restaurantCache.data) {
    return restaurantCache.data;
  }
  restaurantCache.data = await Restaurant.findOne();
  restaurantCache.expires = Date.now() + 300000; // 5 min
  return restaurantCache.data;
}

async function getCachedCategories() {
  if (Date.now() < categoriesCache.expires && categoriesCache.data) {
    return categoriesCache.data;
  }
  categoriesCache.data = await Category.find().select("name name_ar imgURL");
  categoriesCache.expires = Date.now() + 300000;
  return categoriesCache.data;
}

// ============================================================
// COMPRESSED SYSTEM PROMPTS (~200 tokens vs ~600)
// ============================================================
const BASE_SYSTEM_PROMPT = `Restaurant AI assistant.

RULES:
- **IMPORTANT: Match the user's language.** If user writes Arabic, respond in Arabic. If user writes English, respond in English.
- Use tools for real data. Never invent info
- Images: ![name](url)
- Never add to cart without user confirmation

User: {participantId} ({participantType}), Lang: {language}`;

const STATE_PROMPTS = {
  greeting: "\nState: GREETING. Greet warmly, offer help with menu/ordering.",
  browsing: "\nState: BROWSING. Show menu items with images & prices. Use add_to_cart only on request.",
  ordering: "\nState: ORDERING. Help build order. Use get_cart to show cart.",
  cart_review: "\nState: CART REVIEW. Show cart, ask: add more / modify / checkout?",
  service_type: "\nState: SERVICE TYPE. Ask: dine-in (table#) / pickup / delivery (address)?",
  delivery_info: "\nState: DELIVERY. Get delivery address.",
  table_info: "\nState: TABLE. Get table number.",
  coupon: "\nState: COUPON. Ask for promo code.",
  order_summary: "\nState: SUMMARY. Show order total, ask to confirm.",
  payment: "\nState: PAYMENT. Ask: online (Stripe) or in-store?",
  completed: "\nState: DONE. Thank customer, give order number.",
};

// ============================================================
// DIRECT PATTERNS - Skip AI for simple queries
// ============================================================
const DIRECT_PATTERNS = [
  {
    regex: /^(hi|hello|مرحبا|اهلا|السلام|hey)/i,
    response: async (session) => {
      const rest = await getCachedRestaurant();
      const name = rest?.restaurantName || "our restaurant";
      const lang = session.language === "ar";
      return lang 
        ? `مرحباً بك في ${name}! 👋\n\nكيف يمكنني مساعدتك اليوم?\n- تصفح المنيو\n- طلب أكل\n- معلومات عن المطعم`
        : `Welcome to ${name}! 👋\n\nHow can I help you today?\n- Browse the menu\n- Place an order\n- Restaurant info`;
    }
  },
  {
    regex: /(show|view|what.*in).*(cart|سلة)/i,
    response: async (session) => {
      const cart = await Cart.findOne({ userId: session.participantId }).populate("products.productId");
      if (!cart || cart.products.length === 0) {
        return session.language === "ar" ? "سلتك فارغة 🛒" : "Your cart is empty 🛒";
      }
      const items = cart.products.map(p => 
        `• **${p.productId?.name || "Item"}** x${p.quantity} - ${p.price * p.quantity} EGP`
      ).join("\n");
      const total = session.language === "ar" ? "الإجمالي" : "Total";
      return `🛒 **${session.language === "ar" ? "سلتك" : "Your Cart"}:**\n\n${items}\n\n**${total}: ${cart.totalPrice} EGP**`;
    }
  },
  {
    regex: /(categories|أقسام|فئات|sections)/i,
    response: async (session) => {
      const cats = await getCachedCategories();
      const lang = session.language === "ar";
      const items = cats.map(c => `• ${lang ? c.name_ar || c.name : c.name}`).join("\n");
      return lang 
        ? `📂 **الأقسام:**\n\n${items}`
        : `📂 **Categories:**\n\n${items}`;
    }
  },
  {
    regex: /(menu|منيو|قائمة الطعام)$/i,
    response: async (session) => {
      const rest = await getCachedRestaurant();
      if (rest?.branding?.menuImage) {
        return `![Menu](${rest.branding.menuImage})`;
      }
      const cats = await getCachedCategories();
      const lang = session.language === "ar";
      const items = cats.map(c => `• ${lang ? c.name_ar || c.name : c.name}`).join("\n");
      return lang 
        ? `📋 **المنيو:**\n\n${items}\n\nاختر قسم أو اسألني عن أي طبق!`
        : `📋 **Our Menu:**\n\n${items}\n\nPick a category or ask about any item!`;
    }
  },
];

// ============================================================
// TOOL SELECTION BY STATE (reduced tool sets)
// ============================================================
function getToolsForState(state) {
  switch (state) {
    case "greeting":
      return greetingTools;
    case "browsing":
      return browsingTools;
    case "ordering":
    case "cart_review":
      return orderingTools;
    case "service_type":
    case "delivery_info":
    case "table_info":
    case "coupon":
    case "order_summary":
      return checkoutTools;
    case "payment":
      return paymentTools;
    case "completed":
      return greetingTools;
    default:
      return greetingTools;
  }
}

// ============================================================
// STATE TRANSITION LOGIC
// ============================================================
function determineNextState(currentState, aiResponse, toolResults) {
  const responseText = aiResponse?.content?.toLowerCase() || "";
  const hasOrderCreated = toolResults.some(t => t.name === "create_order" && t.success);
  const hasPaymentInitiated = toolResults.some(t => t.name === "initiate_payment" && t.success);
  const hasAddedToCart = toolResults.some(t => t.name === "add_to_cart" && t.success);

  if (currentState === "completed") return "greeting";
  if (hasPaymentInitiated) return "completed";
  if (hasOrderCreated) return "completed";
  if (hasAddedToCart && (currentState === "greeting" || currentState === "browsing")) return "ordering";

  if (currentState === "greeting") {
    if (responseText.includes("menu") || responseText.includes("منيو")) return "browsing";
  }

  if (currentState === "ordering" || currentState === "cart_review") {
    if (responseText.includes("checkout") || responseText.includes("خلصت")) return "service_type";
  }

  if (currentState === "service_type") {
    if (responseText.includes("delivery") || responseText.includes("توصيل")) return "delivery_info";
    if (responseText.includes("dine") || responseText.includes("داخل")) return "table_info";
    if (responseText.includes("pickup") || responseText.includes("استلام")) return "coupon";
  }

  if (currentState === "delivery_info" || currentState === "table_info") return "coupon";
  if (currentState === "coupon") return "order_summary";

  if (currentState === "order_summary") {
    if (responseText.includes("confirm") || responseText.includes("أكد")) return "payment";
  }

  return currentState;
}

// ============================================================
// BUILD MESSAGES - Reduced history (5 instead of 10)
// ============================================================
function buildMessages(session, userMessage) {
  const systemPrompt = BASE_SYSTEM_PROMPT
    .replace("{participantId}", session.participantId)
    .replace("{participantType}", session.participantType)
    .replace("{language}", session.language || "en")
    + (STATE_PROMPTS[session.state] || STATE_PROMPTS.greeting);

  const messages = [new SystemMessage(systemPrompt)];

  // Reduced from 10 to 5 messages
  const history = session.getRecentMessages ? session.getRecentMessages(5) : (session.messages?.slice(-5) || []);
  for (const msg of history) {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      messages.push(new AIMessage(msg.content));
    }
    // Skip tool messages in history - saves tokens
  }

  messages.push(new HumanMessage(userMessage));
  return messages;
}

// ============================================================
// EXECUTE TOOLS
// ============================================================
async function executeTools(toolCalls, session) {
  const results = [];

  for (const toolCall of toolCalls) {
    console.log(`[Chat] Executing tool: ${toolCall.name}`);

    let result = "";
    let parsed = null;

    try {
      const args = { ...toolCall.args };
      if (!args.participantId && toolCall.name !== "restaurant_info" && toolCall.name !== "website_guide") {
        args.participantId = session.participantId;
        args.participantType = session.participantType;
        if (session.user) {
          args.userId = session.user.toString();
        }
      }

      const tool = allTools.find((t) => t.name === toolCall.name);

      if (tool) {
        result = await tool.invoke(args);
        try {
          parsed = JSON.parse(result);
        } catch {
          parsed = { raw: result };
        }
      } else {
        result = JSON.stringify({ error: `Tool ${toolCall.name} not found` });
        parsed = { error: true };
      }
    } catch (error) {
      console.error(`[Chat] Tool ${toolCall.name} failed:`, error);
      result = JSON.stringify({ error: error.message });
      parsed = { error: true };
    }

    results.push({
      id: toolCall.id,
      name: toolCall.name,
      result,
      ...parsed,
    });
  }

  return results;
}

// ============================================================
// MAIN CHAT PROCESSOR (with direct patterns)
// ============================================================
export async function processUserMessage(userMessage, sessionId, participantId, participantType = "guest", userId = null) {
  try {
    console.log(`\n[Chat] ========== New Message ==========`);
    console.log(`[Chat] Session: ${sessionId}, Participant: ${participantId}`);
    console.log(`[Chat] Message: "${userMessage}"`);

    const session = await conversationManager.getOrCreateSession(
      sessionId,
      participantId,
      participantType,
      userId
    );

    // Detect language - follow the user's language each message
    const detectedLang = conversationManager.detectLanguage(userMessage);
    if (detectedLang !== session.language) {
      await conversationManager.updateLanguage(sessionId, detectedLang);
      session.language = detectedLang;
    }

    console.log(`[Chat] State: ${session.state}, Lang: ${session.language}`);

    // ========== CHECK DIRECT PATTERNS FIRST ==========
    for (const pattern of DIRECT_PATTERNS) {
      if (pattern.regex.test(userMessage)) {
        console.log(`[Chat] Direct pattern matched: ${pattern.regex}`);
        const directResponse = await pattern.response(session);
        
        // Save to history
        await conversationManager.addMessage(sessionId, "user", userMessage);
        await conversationManager.addMessage(sessionId, "assistant", directResponse);
        
        return {
          success: true,
          answer: directResponse,
          state: session.state,
          action: null,
          actionData: null,
          sessionId: session.sessionId,
        };
      }
    }

    // ========== NORMAL AI FLOW ==========
    const messages = buildMessages(session, userMessage);
    const tools = getToolsForState(session.state);
    const llmWithTools = chatModel.bindTools(tools);

    console.log(`[Chat] Calling LLM with ${tools.length} tools...`);
    let aiResponse = await llmWithTools.invoke(messages);

    let iterations = 5; // Allow more iterations
    const allToolResults = [];

    while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && iterations > 0) {
      iterations--;
      console.log(`[Chat] AI calling ${aiResponse.tool_calls.length} tool(s)`);

      const toolResults = await executeTools(aiResponse.tool_calls, session);
      allToolResults.push(...toolResults);

      messages.push(aiResponse);
      for (const result of toolResults) {
        // Compress tool results to save tokens
        const compressedResult = result.result.length > 500 
          ? result.result.substring(0, 500) + "..."
          : result.result;
        messages.push(
          new ToolMessage({
            tool_call_id: result.id,
            content: compressedResult,
            name: result.name,
          })
        );
      }

      aiResponse = await llmWithTools.invoke(messages);
    }

    // FALLBACK: If AI response is empty, use last tool result
    let finalAnswer = aiResponse.content;
    if (!finalAnswer || !finalAnswer.trim()) {
      console.log(`[Chat] AI response empty, using last tool result as fallback`);
      const lastToolResult = allToolResults[allToolResults.length - 1];
      if (lastToolResult) {
        finalAnswer = lastToolResult.result;
      } else {
        finalAnswer = "I found the information. How can I help further?";
      }
    }

    // Save to history (only if content exists)
    await conversationManager.addMessage(sessionId, "user", userMessage);
    if (finalAnswer && finalAnswer.trim()) {
      await conversationManager.addMessage(sessionId, "assistant", finalAnswer);
    }

    // State transition
    const nextState = determineNextState(session.state, aiResponse, allToolResults);
    if (nextState !== session.state) {
      console.log(`[Chat] State: ${session.state} -> ${nextState}`);
      await conversationManager.updateState(sessionId, nextState);
    }

    // Check for actions
    let action = null;
    let actionData = null;

    const orderCreation = allToolResults.find((r) => r.name === "create_order" && r.success);
    if (orderCreation) {
      action = "order_created";
      actionData = {
        orderId: orderCreation.orderId,
        orderNumber: orderCreation.orderNumber,
        totalAmount: orderCreation.totalAmount,
      };
    }

    const paymentInit = allToolResults.find((r) => r.name === "initiate_payment" && r.success);
    if (paymentInit) {
      action = "payment_redirect";
      actionData = {
        checkoutUrl: paymentInit.checkoutUrl,
        sessionId: paymentInit.sessionId,
      };
    }

    console.log(`[Chat] Response: "${finalAnswer?.substring(0, 100)}..."`);

    return {
      success: true,
      answer: finalAnswer,
      state: nextState,
      action,
      actionData,
      sessionId: session.sessionId,
    };
  } catch (error) {
    console.error("[Chat Service Error]", error);
    return {
      success: false,
      answer: "Sorry, an error occurred. Please try again.",
      error: error.message,
    };
  }
}

// ============================================================
// GET SESSION INFO
// ============================================================
export async function getSessionInfo(sessionId) {
  try {
    const session = await conversationManager.getSession(sessionId);
    if (!session) {
      return { success: true, messages: [], state: "greeting" };
    }

    const messages = session.messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({
        type: m.role === "user" ? "user" : "bot",
        content: m.content,
        time: m.timestamp?.toISOString() || new Date().toISOString(),
      }));

    return {
      success: true,
      messages,
      state: session.state || "greeting",
    };
  } catch (error) {
    console.error("[getSessionInfo Error]", error);
    return { success: true, messages: [], state: "greeting" };
  }
}

// ============================================================
// RESET CONVERSATION
// ============================================================
export async function resetConversation(sessionId) {
  try {
    await conversationManager.resetSession(sessionId);
    return { success: true, message: "Conversation reset successfully" };
  } catch (error) {
    console.error("[resetConversation Error]", error);
    return { success: false, error: error.message };
  }
}