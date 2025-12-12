import { chatModel } from "../../config/ai.js";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { menuSearchTool, createOrderTool } from "./aiTools.js"; 

// Bind tools to LLM
const llmWithTools = chatModel.bindTools([menuSearchTool, createOrderTool]);

/**
 * Main Chat Processor
 * Handles: User Input -> AI Thinking -> Tool Execution -> Final Response
 */
export async function processUserMessage(userMessage, guestId, chatHistory = []) {
  try {
    console.log(`[Chat] Starting conversation for Guest: ${guestId}`);

    // System Prompt: Defines behavior and image handling
    const systemInstruction = `
       You are 'TastyBot', a smart restaurant waiter.
       
       YOUR DUTIES:
       1. Use 'menu_search' to check availability/prices.
       2. Use 'create_order' ONLY when user explicitly confirms.
       3. Guest ID: "${guestId}" (Must pass to create_order).
       
       IMAGE RULES:
       - If 'menu_search' returns an Image URL, you MUST display it.
       - Use Markdown: ![Food Name](Image URL)
       
       TONE: Friendly, concise, support Arabic & English.
    `;

    const messages = [
      new SystemMessage(systemInstruction),
      ...chatHistory,
      new HumanMessage(userMessage),
    ];

    // Safety: Max 5 turns to avoid infinite loops
    let turns = 5;

    // 1. Initial AI Call
    console.log("[Chat] Invoking LLM...");
    let aiResponse = await llmWithTools.invoke(messages);

    // 2. Loop while AI calls tools
    while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && turns > 0) {
        turns--;
        const toolCall = aiResponse.tool_calls[0];
        console.log(`[Chat Loop] AI calling tool: ${toolCall.name}`);

        let toolResult = "";

        // Execute Tool
        try {
            if (toolCall.name === "menu_search") {
                toolResult = await menuSearchTool.invoke(toolCall.args);
            } else if (toolCall.name === "create_order") {
                toolResult = await createOrderTool.invoke({ ...toolCall.args, guestId });
            }
        } catch (err) {
            console.error(`   -> Tool Execution Failed:`, err);
            toolResult = "Error executing tool.";
        }

        // Add Tool Result to History
        messages.push(aiResponse); 
        messages.push(new ToolMessage({
            tool_call_id: toolCall.id,
            content: toolResult,
            name: toolCall.name,
        }));

        // Call AI again to generate response based on tool result
        aiResponse = await llmWithTools.invoke(messages);
    }

    // Final Response Structure
    return {
        answer: aiResponse.content,
        action: messages.some(m => m.name === "create_order") ? "create_order" : null
    };

  } catch (error) {
    console.error("[Chat Service Error]", error);
    return { answer: "System error. Please try again later.", action: "error" };
  }
}