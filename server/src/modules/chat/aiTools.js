import { tool } from "@langchain/core/tools";
import { z } from "zod";
import mongoose from "mongoose";

// Models
import Product from "../product/Product.js";
import Order from "../order.module/orderModel.js"; // Adjust if your file name is Order.js

// Configs
import { embeddingsModel } from "../../config/ai.js";

/**
 * Tool 1: Menu Search (MongoDB Vector Search)
 * Searches for products and returns formatted text with Images (Markdown).
 */
export const menuSearchTool = tool(
    async ({ query }) => {
        try {
            console.log(`[Tool] Searching MongoDB Vector for: "${query}"`);

            // 1. Convert user query to vector (384 dims)
            const queryVector = await embeddingsModel.embedQuery(query);

            // 2. Perform Vector Search Aggregation
            const results = await Product.aggregate([
                {
                    "$vectorSearch": {
                        "index": "vector_index", // Must match Atlas Index Name
                        "path": "embedding",     // Field in Schema
                        "queryVector": queryVector,
                        "numCandidates": 50,
                        "limit": 5
                    }
                },
                {
                    "$project": {
                        "name": 1, "name_ar": 1, "desc": 1,
                        "basePrice": 1, "imgURL": 1, "options": 1, "_id": 1
                    }
                }
            ]);

            if (!results.length) return "No matching food items found.";

            // 3. Format result (Handle missing data safely)
            return results.map(p => {
                // Safe Options Handling
                const optionsText = (p.options && p.options.length > 0)
                    ? p.options.map(o => o.name).join(", ")
                    : "Standard";

                // Safe Image Handling (Markdown)
                // If imgURL exists, return ![Name](URL), else return empty string
                const imageMarkdown = p.imgURL ? `![${p.name}](${p.imgURL})` : "";

                return `
        - Product: ${p.name} (${p.name_ar || ""})
        - Price: ${p.basePrice} EGP
        - Description: ${p.desc || "No description"}
        - Options: [${optionsText}]
        - ID: ${p._id}
        ${imageMarkdown}
        `;
            }).join("\n---\n");

        } catch (error) {
            console.error("[Tool Error] menu_search:", error);
            return "An error occurred while searching the menu.";
        }
    },
    {
        name: "menu_search",
        description: "Search for food items. Returns details, prices, and images.",
        schema: z.object({
            query: z.string().describe("The food item, category, or flavor the user is asking about"),
        }),
    }
);

/**
 * Tool 2: Create Order
 * Inserts a new order into the database after validating products.
 */
export const createOrderTool = tool(
    async ({ items, guestId, customerName }) => {
        try {
            console.log(`[Tool] Creating order for Guest: ${guestId}`);

            let subtotal = 0;
            const orderItems = [];

            // Loop through requested items
            for (const item of items) {
                // Find product by ID (preferred) or Fuzzy Name
                const query = mongoose.isValidObjectId(item.productId)
                    ? { _id: item.productId }
                    : { name: new RegExp(item.productId, 'i') };

                const product = await Product.findOne(query);

                if (!product) {
                    console.warn(`[Order] Product not found: ${item.productId}`);
                    continue;
                }

                const quantity = item.quantity;
                const price = product.basePrice;
                const totalItemPrice = price * quantity;

                subtotal += totalItemPrice;

                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    image: product.imgURL || "",
                    quantity: quantity,
                    price: price,
                    totalPrice: totalItemPrice,
                    selectedOptions: {}
                });
            }

            if (orderItems.length === 0) return "Failed: No valid products found to order.";

            // Calculate VAT & Total
            const vat = subtotal * 0.14;
            const totalAmount = subtotal + vat;

            // Save to DB
            const newOrder = await Order.create({
                customerId: guestId || `guest_${Date.now()}`,
                customerType: "guest",
                items: orderItems,
                subtotal,
                vat,
                totalAmount,
                paymentMethod: "cash",
                status: "pending",
                customerInfo: { name: customerName || "Guest" },
                serviceType: "dine-in"
            });

            // Return JSON string for AI to parse
            return JSON.stringify({
                success: true,
                orderNumber: newOrder.orderNumber,
                totalAmount: totalAmount,
                message: "Order placed successfully."
            });

        } catch (error) {
            console.error("[Tool Error] create_order:", error);
            return "An error occurred while processing the order.";
        }
    },
    {
        name: "create_order",
        description: "Place a new order ONLY when the user explicitly confirms items.",
        schema: z.object({
            items: z.array(z.object({
                productId: z.string().describe("The Product ID or exact Name"),
                quantity: z.number().min(1)
            })),
            guestId: z.string().describe("The Guest ID from context"),
            customerName: z.string().optional()
        }),
    }
);