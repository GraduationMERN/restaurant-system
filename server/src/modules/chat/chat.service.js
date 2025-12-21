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
// SYSTEM PROMPT - AI Waiter (English Only)
// ============================================================
const BASE_SYSTEM_PROMPT = `You are a friendly AI waiter at {restaurantName}. Your goal is to take orders conversationally and naturally.

**CORE RULES:**
- Speak NATURALLY like a real waiter - avoid robotic/fixed responses
- Always respond in ENGLISH only
- Be helpful, friendly, and patient
- Always confirm product details before adding to cart
- When customer asks for multiple items at once, add them all to cart

===== ORDERING FLOW (5 PHASES) =====

**PHASE 1: WELCOME & MENU**
- When customer opens chat or says hello → Greet warmly with restaurant name
- The menu image is already shown in the welcome message
- Ask: "What would you like to order?"

**PHASE 2: ORDER BUILDING**
When customer asks for an item:
1. Use menu_search(query) to find the product
2. If FOUND:
   - Show product details (name, price, description, image)
   - Ask: "Is this what you're looking for?"
   - If product has Size/options → Ask which size/options they want
   - Ask for quantity if not specified
   - Use add_to_cart(participantId, productId, quantity, selectedOptions)
   - Confirm: "Added to cart! Would you like anything else?"
3. If NOT FOUND:
   - Tell customer item not available
   - Suggest similar alternatives
   - Use get_categories() to show what's available

Customer can:
- Order multiple items at once → Add all to cart
- Modify quantity → Use update_cart_item with new quantity
- Remove item → Use update_cart_item with quantity=0
- View cart → Use get_cart(participantId)

After adding items, use get_suggestions(participantId) to recommend complementary items.

**PHASE 3: SERVICE TYPE**
When customer says "done/checkout/that's all":
1. Use get_cart(participantId) to show current order summary
2. Ask: "How would you like your order?"
   - "🏠 Delivery"
   - "🏪 Pickup"  
   - "🪑 Dine-in"

Based on choice:
- **dine-in** → Ask: "What's your table number?"
- **delivery** → Ask: "What's your delivery address?"
- **pickup** → Continue to Phase 4

**PHASE 4: COUPON & ORDER SUMMARY**
1. Ask: "Do you have a coupon or promo code?"
2. If YES → Use validate_coupon(code, cartTotal)
   - If valid: Show discount amount
   - If invalid: Tell customer and continue
3. If NO → Continue

Then show complete order summary:
- All items with names, quantities, prices
- Subtotal
- VAT (14%)
- Discount (if coupon applied)
- **Total amount**

Ask: "Would you like to confirm your order?"

Customer can still modify items at this point.

**PHASE 5: PAYMENT**
After customer confirms order:
1. Ask: "How would you like to pay?"
   - "💳 Online (Visa/Mastercard)"
   - "💵 Pay at counter"

Based on choice:
- **online** → 
  1. Call create_order(participantId, participantType, serviceType, "online", tableNumber?, deliveryAddress?, couponCode?)
  2. Call initiate_payment(orderId) to get Stripe checkout URL
  3. Say: "Redirecting you to secure payment..."

- **instore** →
  1. Call create_order(participantId, participantType, serviceType, "instore", tableNumber?, deliveryAddress?, couponCode?)
  2. Say: "Please proceed to the cashier. Your order number is: {orderNumber}"
  3. Say thank you message

===== IMPORTANT NOTES =====

1. **Natural Language**: Respond naturally based on context. Don't use fixed templates.
2. **Confirmation**: Always show product details BEFORE adding to cart.
3. **Multiple Items**: If customer orders multiple items, search and add each one.
4. **Modifications**: Customer can modify their order at any point before payment.
5. **English Only**: Always respond in English regardless of input language.

===== AVAILABLE TOOLS =====
- restaurant_info(topic) - Get restaurant info, menu image, about, contact, faqs, etc.
- menu_search(query, categoryName?) - Search for products in menu
- get_product_details(productId) - Get full product details with options
- get_categories() - List all menu categories
- add_to_cart(participantId, productId, quantity, selectedOptions) - Add item to cart
- get_cart(participantId) - View current cart contents
- update_cart_item(participantId, productId, newQuantity) - Update quantity or remove (0)
- get_suggestions(participantId) - Get recommended additional items
- validate_coupon(code, orderTotal) - Check if coupon is valid
- create_order(participantId, participantType, serviceType, paymentMethod, tableNumber?, deliveryAddress?, couponCode?) - Create final order
- initiate_payment(orderId) - Start Stripe online payment

**Customer ID:** {participantId}
**Customer Type:** {participantType}`;

const STATE_PROMPTS = {
  greeting: `\n[PHASE 1: WELCOME] The welcome message with menu is already shown. Ask "What would you like to order?"`,
  browsing: `\n[PHASE 2: ORDER BUILDING] Customer is exploring menu. Use menu_search to find products. Show product details with image and price. Confirm before adding to cart. Ask about size/options if available.`,
  ordering: `\n[PHASE 2: ORDER BUILDING] Customer has items in cart. After each addition, ask "Would you like anything else?". Use get_suggestions for recommendations. When customer says done → show cart and move to service type.`,
  cart_review: `\n[PHASE 3: SERVICE TYPE] Show cart summary with get_cart. Ask: "How would you like your order? 🏠 Delivery - 🏪 Pickup - 🪑 Dine-in"`,
  service_type: `\n[PHASE 3] Wait for service type choice. pickup→continue to coupon, delivery→ask for address, dine-in→ask for table number.`,
  delivery_info: `\n[PHASE 3] Get delivery address from customer. Once received, ask about coupon: "Do you have a coupon or promo code?"`,
  table_info: `\n[PHASE 3] Get table number from customer. Once received, ask about coupon: "Do you have a coupon or promo code?"`,
  coupon: `\n[PHASE 4: COUPON & SUMMARY] If customer has coupon→use validate_coupon. Then show complete order summary (items, subtotal, VAT, discount, total). Ask "Would you like to confirm your order?"`,
  order_summary: `\n[PHASE 4] Show complete order details with totals. Ask for final confirmation. Customer can still modify. When confirmed→move to payment.`,
  payment: `\n[PHASE 5: PAYMENT] Ask: "How would you like to pay? 💳 Online - 💵 Pay at counter". On choice: call create_order FIRST, then initiate_payment if online.`,
  completed: `\n[COMPLETED] Order placed! Thank customer warmly. Show order number. Say goodbye. Offer to help with anything else.`,
};

// ============================================================
// DIRECT PATTERNS - Fixed welcome with menu display (English only)
// ============================================================
const DIRECT_PATTERNS = [
  // Greeting pattern - show fixed welcome with menu
  {
    regex: /^(hi|hello|hey|hola|start|menu|order|yo|greetings)$/i,
    response: async (session) => {
      const rest = await getCachedRestaurant();
      const name = rest?.restaurantName || "Our Restaurant";
      const menuImage = rest?.branding?.menuImage;
      
      let greeting = `Welcome to **${name}**! 👋\n\n`;
      
      if (menuImage) {
        greeting += `📋 **Our Menu:**\n![${name} Menu](${menuImage})\n\n`;
      }
      
      greeting += `🍽️ What would you like to order?`;
      
      return greeting;
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
// STATE TRANSITION LOGIC - English only intent detection
// ============================================================
function determineNextState(currentState, aiResponse, toolResults, userMessage = "") {
  const responseText = (aiResponse?.content || "").toLowerCase();
  const userText = userMessage.toLowerCase();
  
  // Tool-based transitions
  const hasOrderCreated = toolResults.some(t => t.name === "create_order" && t.success);
  const hasPaymentInitiated = toolResults.some(t => t.name === "initiate_payment" && t.success);
  const hasAddedToCart = toolResults.some(t => t.name === "add_to_cart" && t.success);
  const hasCouponValidated = toolResults.some(t => t.name === "validate_coupon");
  const hasCartViewed = toolResults.some(t => t.name === "get_cart");
  const hasMenuViewed = toolResults.some(t => t.name === "restaurant_info" || t.name === "menu_search");

  // Complete states
  if (hasPaymentInitiated) return "completed";
  if (hasOrderCreated) return "completed";
  if (currentState === "completed") return "greeting";

  // Cart additions move to ordering
  if (hasAddedToCart) {
    return "ordering";
  }

  // Intent patterns (English only)
  const checkoutIntent = /(done|that's all|checkout|finish|finished|complete|i'm done)/i;
  const confirmIntent = /(confirm|yes|yeah|yep|ok|okay|sure|go ahead|proceed)/i;
  const noCouponIntent = /(no|nope|don't have|no coupon|none|skip)/i;
  
  // Greeting → Browsing (when user asks about menu or food)
  if (currentState === "greeting") {
    if (hasMenuViewed || responseText.includes("menu") || 
        userText.includes("food") || userText.includes("order") || 
        userText.includes("want") || userText.includes("like")) {
      return "browsing";
    }
  }

  // Browsing → Ordering (after viewing products)
  if (currentState === "browsing" && hasAddedToCart) {
    return "ordering";
  }

  // Ordering → Cart Review (when user says done or cart is viewed)
  if (currentState === "ordering") {
    if (checkoutIntent.test(userText) || hasCartViewed) {
      return "cart_review";
    }
  }

  // Cart Review → Service Type (when asking about service type)
  if (currentState === "cart_review") {
    if (responseText.includes("pickup") || responseText.includes("delivery") || 
        responseText.includes("dine") || responseText.includes("how would you like")) {
      return "service_type";
    }
  }

  // Service Type → Delivery/Table/Coupon
  if (currentState === "service_type") {
    if (userText.includes("delivery") || userText.includes("deliver")) {
      return "delivery_info";
    }
    if (userText.includes("dine") || userText.includes("table") || userText.includes("eat here") ||
        userText.includes("here")) {
      return "table_info";
    }
    if (userText.includes("pickup") || userText.includes("pick up") || userText.includes("collect") ||
        userText.includes("take away") || userText.includes("takeaway")) {
      return "coupon";
    }
  }

  // Delivery/Table → Coupon (after getting address/table)
  if (currentState === "delivery_info") {
    if (userText.length > 5 || responseText.includes("coupon") || responseText.includes("promo")) {
      return "coupon";
    }
  }
  if (currentState === "table_info") {
    if (/\d/.test(userText) || responseText.includes("coupon") || responseText.includes("promo")) {
      return "coupon";
    }
  }

  // Coupon → Order Summary
  if (currentState === "coupon") {
    if (hasCouponValidated || noCouponIntent.test(userText) || 
        responseText.includes("summary") || responseText.includes("total")) {
      return "order_summary";
    }
  }

  // Order Summary → Payment (on confirmation)
  if (currentState === "order_summary") {
    if (confirmIntent.test(userText) || responseText.includes("payment") ||
        responseText.includes("pay")) {
      return "payment";
    }
  }

  // Payment → Complete (on payment method selection)
  if (currentState === "payment") {
    if (userText.includes("cash") || userText.includes("store") || userText.includes("counter") || 
        userText.includes("instore") || userText.includes("online") || userText.includes("card") ||
        hasOrderCreated) {
      return "completed";
    }
  }

  return currentState;
}

// ============================================================
// BUILD MESSAGES - Include context and history
// ============================================================
async function buildMessages(session, userMessage) {
  // Get restaurant name for personalization
  const restaurant = await getCachedRestaurant();
  const restaurantName = restaurant?.restaurantName || "our restaurant";
  
  const systemPrompt = BASE_SYSTEM_PROMPT
    .replace(/{restaurantName}/g, restaurantName)
    .replace(/{participantId}/g, session.participantId)
    .replace(/{participantType}/g, session.participantType)
    + (STATE_PROMPTS[session.state] || STATE_PROMPTS.greeting);

  const messages = [new SystemMessage(systemPrompt)];

  // Increased to 8 messages for better context in ordering flows
  const history = session.getRecentMessages ? session.getRecentMessages(8) : (session.messages?.slice(-8) || []);
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
        
        // Save only the welcome response to history (skip user greeting trigger)
        // This makes the chat start clean with just the welcome message
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
    const messages = await buildMessages(session, userMessage);
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