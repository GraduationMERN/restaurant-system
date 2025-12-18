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
// FORMAT TOOL RESULTS - Convert JSON to human-readable
// ============================================================
function formatToolResult(toolResult, language = "en") {
  const isAr = language === "ar";
  
  // Parse if string
  let data = toolResult;
  if (typeof toolResult.result === "string") {
    try {
      data = JSON.parse(toolResult.result);
    } catch {
      // If not JSON, return as is
      return toolResult.result;
    }
  }
  
  // If it has a message field, use it
  if (isAr && data.message) return data.message;
  if (!isAr && data.message_en) return data.message_en;
  if (data.message) return data.message;
  
  // Format based on tool name or success type
  if (data.success === true) {
    // Add to cart success
    if (data.addedItem) {
      const item = data.addedItem;
      return isAr 
        ? `✅ تمت إضافة **${item.quantity}x ${item.name_ar || item.name}** للسلة\n\n💰 السعر: ${item.totalPrice} جنيه\n🛒 إجمالي السلة: ${data.cartTotal} جنيه`
        : `✅ Added **${item.quantity}x ${item.name}** to cart\n\n💰 Price: ${item.totalPrice} EGP\n🛒 Cart total: ${data.cartTotal} EGP`;
    }
    
    // Order created
    if (data.orderNumber) {
      return isAr
        ? `✅ تم إنشاء طلبك بنجاح!\n\n📋 رقم الطلب: **${data.orderNumber}**\n💰 الإجمالي: ${data.totalAmount} جنيه`
        : `✅ Your order was created successfully!\n\n📋 Order number: **${data.orderNumber}**\n💰 Total: ${data.totalAmount} EGP`;
    }
    
    // Coupon validated
    if (data.discount !== undefined) {
      return isAr
        ? `✅ كوبون صالح! خصم **${data.discount} جنيه**`
        : `✅ Valid coupon! Discount: **${data.discount} EGP**`;
    }
    
    // Support ticket
    if (data.ticketId) {
      return isAr
        ? `✅ ${data.message}\n\nرقم التذكرة: ${data.ticketId}`
        : `✅ ${data.message_en || data.message}\n\nTicket ID: ${data.ticketId}`;
    }
  }
  
  // Error responses
  if (data.success === false || data.error) {
    return isAr 
      ? `❌ ${data.message || data.error || "حدث خطأ"}`
      : `❌ ${data.message_en || data.message || data.error || "An error occurred"}`;
  }
  
  // Restaurant info
  if (data.found === true) {
    let info = "";
    if (data.name) info += `**${data.name}**\n`;
    if (data.description) info += `${data.description}\n`;
    if (data.phone) info += `📞 ${data.phone}\n`;
    if (data.address) info += `📍 ${data.address}\n`;
    if (data.menuImage) info += `![Menu](${data.menuImage})`;
    return info || (isAr ? "معلومات المطعم" : "Restaurant info");
  }
  
  // Default: return the raw result or a generic message
  if (data.raw) return data.raw;
  
  return isAr ? "تم!" : "Done!";
}

// ============================================================
// SYSTEM PROMPT - Complete Ordering Flow
// ============================================================
const BASE_SYSTEM_PROMPT = `You are BrandBite's AI waiter. Act friendly and conversational. Use tools for ALL actions.

**LANGUAGE:** Match customer's language (Arabic/English).

===== WHAT YOU CAN DO =====

1️⃣ **GREETING** - Say hello warmly, offer to help

2️⃣ **MENU & PRODUCT QUESTIONS**
   - Use menu_search(query) to find products
   - Use get_categories() to show menu sections
   - Show product details with image, price, description

3️⃣ **RESTAURANT INFO**
   - Use restaurant_info(topic) - topics: about, contact, faqs, terms, privacy, location, menu

4️⃣ **COMPLAINTS/FEEDBACK**
   - Use submit_support(type, message) - types: complaint, feedback, thanks

5️⃣ **WEBSITE HELP**
   - Use website_guide(topic) to explain how to order

6️⃣ **ORDERING (MAIN FLOW)**

   **Step 1: Finding Products**
   - Customer: "I want burger" → YOU: call menu_search("burger")
   - Show product with image and ask: "هل تريده؟" / "Would you like this?"
   - If product not found → suggest alternatives

   **Step 2: Adding to Cart**
   - Customer: "yes" → Ask about Size if product has options
   - Customer: "small" → call add_to_cart(participantId, productId, 1, {Size: "Small"})
   - Confirm: "تم الإضافة! تريد حاجة تانية؟"
   - Customer can order multiple items, modify, or delete

   **Step 3: Suggestions**
   - After adding items, use get_suggestions(participantId) to recommend more items

   **Step 4: Done Ordering**
   - Customer: "done/خلاص" → call get_cart(participantId)
   - Show cart and ask: "تأكد من الطلب؟"

7️⃣ **SERVICE TYPE**
   - Ask: "طلبك هيكون ازاي؟ pickup / delivery / dine-in"
   - pickup → continue
   - delivery → ask for address
   - dine-in → ask for table number

8️⃣ **COUPON**
   - Ask: "معاك كود خصم؟"
   - If yes → call validate_coupon(code, participantId)
   - If no → continue

9️⃣ **ORDER SUMMARY**
   - Show complete order details: items, quantities, prices, subtotal, VAT, total
   - Ask: "أكد الطلب؟" / "Confirm order?"
   - Customer can still modify

🔟 **PAYMENT**
   - Ask: "تدفع online ولا cash؟"
   - **online**: call create_order(..., paymentMethod: "online") then initiate_payment(orderId)
   - **cash**: call create_order(..., paymentMethod: "cash")
   - After order: "شكراً! رقم طلبك: XXX"

===== AVAILABLE TOOLS =====
- menu_search(query, categoryName?)
- get_categories()
- get_product_details(productId)
- add_to_cart(participantId, productId, quantity, selectedOptions)
- get_cart(participantId)
- update_cart_item(participantId, productId, newQuantity)
- get_suggestions(participantId)
- validate_coupon(code, participantId)
- restaurant_info(topic)
- submit_support(type, message, name?, email?)
- website_guide(topic)
- create_order(participantId, participantType, serviceType, paymentMethod, tableNumber?, deliveryAddress?, couponCode?)
- initiate_payment(orderId)

**Customer ID:** {participantId}
**Language:** {language}`;

const STATE_PROMPTS = {
  greeting: `\n[GREETING] Say hello. Ask what they want.`,
  browsing: `\n[BROWSING] Customer looking at menu. Use menu_search. Ask to add to cart.`,
  ordering: `\n[ORDERING] Customer has items. Ask "تريد حاجة تانية؟"/"Anything else?" If done→show cart.`,
  cart_review: `\n[CART REVIEW] Use get_cart. Then ask: "pickup, delivery, or dine-in?"`,
  service_type: `\n[SERVICE TYPE] Wait for customer choice. pickup→coupon, delivery→ask address, dine-in→ask table#`,
  delivery_info: `\n[DELIVERY] Get address. THEN ask: "معاك كود خصم؟"/"Have a coupon?" DO NOT go to payment yet!`,
  table_info: `\n[TABLE] Get table number. THEN ask: "معاك كود خصم؟"/"Have a coupon?" DO NOT go to payment yet!`,
  coupon: `\n[COUPON] If has code→validate_coupon. Then show order summary with get_cart. Ask "أكد الطلب؟"`,
  order_summary: `\n[SUMMARY] Show cart details. Ask "أكد الطلب؟"/"Confirm order?" DO NOT process payment until confirmed!`,
  payment: `\n[PAYMENT] Ask: "online or cash?" THEN call create_order FIRST, then initiate_payment if online.`,
  completed: `\n[COMPLETED] Thank customer. Show order number.`,
};

// ============================================================
// DIRECT PATTERNS - Minimal, only greeting
// ============================================================
const DIRECT_PATTERNS = [
  // Only greeting - everything else via AI tools
  {
    regex: /^(hi|hello|مرحبا|اهلا|السلام عليكم|hey|هاي|hola)$/i,
    response: async (session) => {
      const rest = await getCachedRestaurant();
      const name = rest?.restaurantName || "our restaurant";
      const lang = session.language === "ar";
      return lang 
        ? `مرحباً بك في ${name}! 👋\n\nكيف يمكنني مساعدتك؟\n- عرض المنيو\n- طلب أكل`
        : `Welcome to ${name}! 👋\n\nHow can I help you?\n- View menu\n- Place an order`;
    }
  },
];

// ============================================================
// TOOL SELECTION - Give AI all tools
// ============================================================
function getToolsForState(state) {
  // Give AI access to ALL tools so it can decide what to use
  return allTools;
}

// ============================================================
// STATE TRANSITION LOGIC - Improved intent detection
// ============================================================
function determineNextState(currentState, aiResponse, toolResults, userMessage = "") {
  const responseText = (aiResponse?.content || "").toLowerCase();
  const userText = userMessage.toLowerCase();
  
  // Tool-based transitions
  const hasOrderCreated = toolResults.some(t => t.name === "create_order" && t.success);
  const hasPaymentInitiated = toolResults.some(t => t.name === "initiate_payment" && t.success);
  const hasAddedToCart = toolResults.some(t => t.name === "add_to_cart" && t.success);
  const hasCouponValidated = toolResults.some(t => t.name === "validate_coupon" && t.valid);

  // Complete states
  if (hasPaymentInitiated) return "completed";
  if (hasOrderCreated && !responseText.includes("payment")) return "completed";
  if (currentState === "completed") return "greeting";

  // Cart additions move to ordering
  if (hasAddedToCart && (currentState === "greeting" || currentState === "browsing")) {
    return "ordering";
  }

  // Check user intent for checkout
  const checkoutIntent = /(done|خلصت|خلاص|كده|that's all|checkout|انهاء|متابعة)/i;
  const confirmIntent = /(confirm|أكد|تمام|yes|ايوه|اوكي|ok|نعم)/i;
  
  // Greeting → Browsing
  if (currentState === "greeting") {
    if (responseText.includes("menu") || responseText.includes("منيو") || 
        userText.includes("اكل") || userText.includes("food")) {
      return "browsing";
    }
  }

  // Ordering → Service Type (when user says done)
  if (currentState === "ordering" || currentState === "cart_review") {
    if (checkoutIntent.test(userText) || responseText.includes("service type") || 
        responseText.includes("نوع الخدمة")) {
      return "service_type";
    }
  }

  // Service Type → Delivery/Table/Coupon
  if (currentState === "service_type") {
    if (userText.includes("delivery") || userText.includes("توصيل") || userText.includes("دليفري")) {
      return "delivery_info";
    }
    if (userText.includes("dine") || userText.includes("داخل") || userText.includes("table") || 
        userText.includes("طاولة") || userText.includes("في المطعم")) {
      return "table_info";
    }
    if (userText.includes("pickup") || userText.includes("استلام") || userText.includes("تيك اواي")) {
      return "coupon";
    }
  }

  // Delivery/Table → Coupon (after getting address/table)
  if (currentState === "delivery_info" && (userText.length > 5 || responseText.includes("coupon"))) {
    return "coupon";
  }
  if (currentState === "table_info" && (/\d/.test(userText) || responseText.includes("coupon"))) {
    return "coupon";
  }

  // Coupon → Order Summary
  if (currentState === "coupon") {
    if (hasCouponValidated || userText.includes("no") || userText.includes("لا") || 
        userText.includes("مفيش") || responseText.includes("summary")) {
      return "order_summary";
    }
  }

  // Order Summary → Payment (on confirmation)
  if (currentState === "order_summary") {
    if (confirmIntent.test(userText) || responseText.includes("payment")) {
      return "payment";
    }
  }

  // Payment → Complete (on payment method)
  if (currentState === "payment") {
    if (userText.includes("cash") || userText.includes("store") || userText.includes("كاشير") || 
        userText.includes("المطعم") || hasOrderCreated) {
      return "completed";
    }
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
        
        // If response is null, skip to AI handling
        if (directResponse === null) {
          console.log(`[Chat] Pattern returned null, falling back to AI`);
          break;
        }
        
        // Handle object response (with action)
        let answer = directResponse;
        let action = null;
        let actionData = null;
        
        if (typeof directResponse === "object" && directResponse.message) {
          answer = directResponse.message;
          action = directResponse.action || null;
          actionData = directResponse.actionData || null;
        }
        
        // Save to history
        await conversationManager.addMessage(sessionId, "user", userMessage);
        await conversationManager.addMessage(sessionId, "assistant", answer);
        
        return {
          success: true,
          answer,
          state: session.state,
          action,
          actionData,
          sessionId: session.sessionId,
        };
      }
    }

    // ========== NORMAL AI FLOW ==========
    const messages = buildMessages(session, userMessage);
    const tools = getToolsForState(session.state);
    const llmWithTools = chatModel.bindTools(tools);

    console.log(`[Chat] Calling LLM with ${tools.length} tools: ${tools.map(t => t.name).join(', ')}`);
    
    let aiResponse;
    let iterations = 5;
    const allToolResults = [];
    
    try {
      aiResponse = await llmWithTools.invoke(messages);
      
      // Log whether AI made tool calls
      if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
        console.log(`[Chat] ✅ AI made ${aiResponse.tool_calls.length} tool call(s):`, aiResponse.tool_calls.map(tc => tc.name));
      } else {
        console.log(`[Chat] ⚠️ AI responded WITHOUT tool calls. Content:`, aiResponse.content?.substring(0, 100));
      }

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

        try {
          aiResponse = await llmWithTools.invoke(messages);
        } catch (toolError) {
          // Handle Groq tool_use_failed errors during iteration
          console.error(`[Chat] Tool iteration error:`, toolError.message);
          break;
        }
      }
    } catch (llmError) {
      // Handle Groq API errors (especially tool_use_failed)
      console.error(`[Chat] LLM Error:`, llmError.message);
      
      // Check if it's a tool_use_failed error
      const isToolError = llmError.message?.includes('tool_use_failed') || 
                          llmError.error?.code === 'tool_use_failed';
      
      if (isToolError) {
        console.log(`[Chat] Tool calling failed, trying without tools...`);
        
        // Retry without tool binding
        try {
          const simpleResponse = await chatModel.invoke(messages);
          aiResponse = simpleResponse;
        } catch (retryError) {
          console.error(`[Chat] Retry failed:`, retryError.message);
          // Provide a helpful fallback response
          aiResponse = { content: session.language === "ar" 
            ? "عذراً، حدث خطأ. يمكنك إرسال ملاحظاتك من صفحة 'تواصل معنا' أو أخبرني بالتفصيل كيف يمكنني مساعدتك."
            : "Sorry, there was an error. You can send feedback from the 'Contact Us' page, or tell me how I can help you." 
          };
        }
      } else {
        // Rethrow non-tool errors
        throw llmError;
      }
    }

    // FALLBACK: If AI response is empty, format tool result as response
    let finalAnswer = aiResponse?.content || "";
    if (!finalAnswer || !finalAnswer.trim()) {
      console.log(`[Chat] AI response empty, formatting tool result as fallback`);
      const lastToolResult = allToolResults[allToolResults.length - 1];
      if (lastToolResult) {
        // Format the tool result into a human-readable response
        finalAnswer = formatToolResult(lastToolResult, session.language);
      } else {
        finalAnswer = session.language === "ar" 
          ? "كيف يمكنني مساعدتك؟" 
          : "How can I help you?";
      }
    }
    
    // Also check if response is raw JSON and format it
    if (finalAnswer.startsWith("{") && finalAnswer.includes("success")) {
      try {
        const parsed = JSON.parse(finalAnswer);
        finalAnswer = formatToolResult({ ...parsed, name: "parsed" }, session.language);
      } catch (e) {
        // Keep as is if not valid JSON
      }
    }

    // Save to history (only if content exists)
    await conversationManager.addMessage(sessionId, "user", userMessage);
    if (finalAnswer && finalAnswer.trim()) {
      await conversationManager.addMessage(sessionId, "assistant", finalAnswer);
    }

    // State transition
    const nextState = determineNextState(session.state, aiResponse, allToolResults, userMessage);
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