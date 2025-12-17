import { tool } from "@langchain/core/tools";
import { z } from "zod";
import mongoose from "mongoose";

// Models
import Product from "../product/Product.js";
import Category from "../category/Category.js";
import Order from "../order.module/orderModel.js";
import Cart from "../cart/Cart.js";
import Restaurant from "../restaurant/restaurant.model.js";
import Support from "../support/support.model.js";
import { Coupon } from "../coupon/coupon.model.js";

// Services
import { getProductByIdService } from "../product/product.service.js";
import PaymentService from "../payment/paymentService.js";

// Configs
import { embeddingsModel } from "../../config/ai.js";

// ============================================================
// TOOL 1: MENU SEARCH (Enhanced with stock & availability)
// ============================================================

// Arabic to English translation for common food terms
const ARABIC_TO_ENGLISH = {
  "قهوة": "coffee", "شاي": "tea", "عصير": "juice",
  "برجر": "burger", "بيتزا": "pizza", "سلطة": "salad",
  "دجاج": "chicken", "لحم": "beef", "سمك": "fish",
  "بطاطس": "fries", "رز": "rice", "خبز": "bread",
  "ميلك شيك": "milkshake", "ايس كريم": "ice cream",
  "كيك": "cake", "حلويات": "dessert", "مشروبات": "drinks",
  "ساندويتش": "sandwich", "باستا": "pasta", "شوربة": "soup",
  "فطور": "breakfast", "غداء": "lunch", "عشاء": "dinner",
};

function translateQuery(query) {
  let translated = query.toLowerCase();
  for (const [ar, en] of Object.entries(ARABIC_TO_ENGLISH)) {
    if (translated.includes(ar)) {
      translated = translated.replace(ar, en);
    }
  }
  return translated;
}

export const menuSearchTool = tool(
  async ({ query, categoryName }) => {
    try {
      // Translate Arabic to English for better search
      const originalQuery = query;
      const searchQuery = translateQuery(query);
      console.log(`[Tool:menu_search] Query: "${originalQuery}" -> "${searchQuery}", Category: "${categoryName || 'all'}"`);

      let results = [];

      // If category specified, filter by category first
      if (categoryName) {
        const category = await Category.findOne({
          $or: [
            { name: new RegExp(categoryName, "i") },
            { name_ar: new RegExp(categoryName, "i") },
          ],
        });

        if (category) {
          results = await Product.find({
            categoryId: category._id,
            stock: { $gt: 0 },
          })
            .select("name name_ar desc basePrice imgURL options stock _id")
            .limit(10);
        }
      }

      // If no category or no results, use vector search
      if (results.length === 0 && searchQuery) {
        try {
          const queryVector = await embeddingsModel.embedQuery(searchQuery);

        results = await Product.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 100,
              limit: 10,
            },
          },
          {
            $project: {
              name: 1,
              name_ar: 1,
              desc: 1,
              basePrice: 1,
              imgURL: 1,
              options: 1,
              stock: 1,
              _id: 1,
            },
          },
          ]);
          console.log(`[Tool:menu_search] Vector search returned ${results.length} results`);
        } catch (vectorErr) {
          console.error(`[Tool:menu_search] Vector search error:`, vectorErr.message);
        }

        // Fallback: text search (search both original Arabic and translated English)
        if (results.length === 0) {
          console.log(`[Tool:menu_search] Fallback to text search for: ${searchQuery}`);
          results = await Product.find({
            $or: [
              { name: new RegExp(searchQuery, "i") },
              { name_ar: new RegExp(originalQuery, "i") },
              { desc: new RegExp(searchQuery, "i") },
            ],
          })
            .select("name name_ar desc basePrice imgURL options stock _id")
            .limit(10);
          console.log(`[Tool:menu_search] Text search returned ${results.length} results`);
        }
      }

      if (!results.length) {
        return "No matching products found. Try a different search term or browse categories.";
      }

      // PRE-FORMAT as Markdown - saves AI tokens
      const formatted = results.map((p) => {
        let card = `**${p.name}** - ${p.basePrice} EGP`;
        if (p.imgURL) card += `\n![${p.name}](${p.imgURL})`;
        if (p.desc) card += `\n${p.desc.substring(0, 80)}`;
        if (p.stock <= 0) card += `\n⚠️ *Out of stock*`;
        if (p.options?.length) {
          const opts = p.options.map(o => o.name).join(", ");
          card += `\n*Options: ${opts}*`;
        }
        card += `\n\`ID: ${p._id}\``;
        return card;
      }).join("\n\n---\n\n");

      return `Found ${results.length} item(s):\n\n${formatted}`;
    } catch (error) {
      console.error("[Tool:menu_search] Error:", error);
      return "Error searching menu. Please try again.";
    }
  },
  {
    name: "menu_search",
    description: "Search for food items in the menu. Returns products with prices, availability, and options (sizes, extras). Use when customer asks about menu, specific food, or prices.",
    schema: z.object({
      query: z.string().describe("The food item, ingredient, or flavor to search for"),
      categoryName: z.string().optional().describe("Optional category name to filter by (e.g., 'Burgers', 'Drinks', 'مشروبات')"),
    }),
  }
);

// ============================================================
// TOOL 2: GET ALL CATEGORIES
// ============================================================
export const getCategoriesList = tool(
  async () => {
    try {
      const categories = await Category.find().select("name name_ar imgURL");
      
      // PRE-FORMAT as Markdown
      const list = categories.map(c => `• **${c.name}**`).join("\n");
      return `📂 **Menu Categories:**\n\n${list}\n\nAsk about any category to see items!`;
    } catch (error) {
      console.error("[Tool:get_categories] Error:", error);
      return "Error fetching categories. Please try again.";
    }
  },
  {
    name: "get_categories",
    description: "Get list of all menu categories. Use when customer wants to browse the menu by category.",
    schema: z.object({}),
  }
);

// ============================================================
// TOOL 3: RESTAURANT INFO
// ============================================================
export const restaurantInfoTool = tool(
  async ({ topic }) => {
    try {
      console.log(`[Tool:restaurant_info] Topic: "${topic}"`);

      const restaurant = await Restaurant.findOne();
      if (!restaurant) {
        return JSON.stringify({ found: false, message: "Restaurant info not found" });
      }

      let info = {};

      switch (topic) {
        case "about":
          info = {
            name: restaurant.restaurantName,
            description: restaurant.description,
            about: restaurant.about,
          };
          break;

        case "contact":
          info = {
            phone: restaurant.phone,
            address: restaurant.address,
            support: restaurant.support,
          };
          break;

        case "faqs":
          info = {
            faqs: restaurant.faqs,
          };
          break;

        case "terms":
          info = {
            terms: restaurant.policies?.terms,
          };
          break;

        case "privacy":
          info = {
            privacy: restaurant.policies?.privacy,
          };
          break;

        case "location":
          info = {
            address: restaurant.address,
          };
          break;

        case "menu":
          if (restaurant.branding?.menuImage) {
            info = {
              name: restaurant.restaurantName,
              menuImage: restaurant.branding.menuImage,
              message: `Here is our menu! ![${restaurant.restaurantName} Menu](${restaurant.branding.menuImage})`,
            };
          } else {
            info = {
              name: restaurant.restaurantName,
              message: "Menu image not available. Please ask me about specific items or categories!",
            };
          }
          break;

        case "all":
        default:
          info = {
            name: restaurant.restaurantName,
            description: restaurant.description,
            phone: restaurant.phone,
            address: restaurant.address,
          };
      }

      return JSON.stringify({ found: true, ...info });
    } catch (error) {
      console.error("[Tool:restaurant_info] Error:", error);
      return JSON.stringify({ found: false, error: "Error fetching restaurant info" });
    }
  },
  {
    name: "restaurant_info",
    description: "Get restaurant information like about us, contact, FAQs, terms, privacy policy, location, or menu image. Use 'menu' topic when user asks to see the menu.",
    schema: z.object({
      topic: z
        .enum(["about", "contact", "faqs", "terms", "privacy", "location", "menu", "all"])
        .describe("What information to retrieve. Use 'menu' when user asks where the menu is."),
    }),
  }
);

// ============================================================
// TOOL 4: SUBMIT SUPPORT/FEEDBACK
// ============================================================
export const submitSupportTool = tool(
  async ({ type, message, customerName, customerEmail }) => {
    try {
      console.log(`[Tool:submit_support] Type: ${type}`);

      const support = await Support.create({
        name: customerName || "Anonymous",
        email: customerEmail || "noemail@chat.com",
        subject: type === "complaint" ? "شكوى" : type === "thanks" ? "شكر" : "Feedback",
        type: type === "thanks" ? "feedback" : type,
        message,
      });

      return JSON.stringify({
        success: true,
        ticketId: support._id.toString(),
        message: type === "complaint" 
          ? "تم استلام شكواك وسيتم التواصل معك قريباً"
          : "شكراً لرأيك! نقدر تواصلك معنا",
        message_en: type === "complaint"
          ? "Your complaint has been received. We will contact you soon."
          : "Thank you for your feedback!",
      });
    } catch (error) {
      console.error("[Tool:submit_support] Error:", error);
      return JSON.stringify({ success: false, error: "Failed to submit" });
    }
  },
  {
    name: "submit_support",
    description: "Submit a complaint, feedback, or thanks message. Use when customer wants to report an issue, give feedback, or express gratitude.",
    schema: z.object({
      type: z.enum(["complaint", "feedback", "thanks"]).describe("Type of submission"),
      message: z.string().describe("The customer's message"),
      customerName: z.string().optional().describe("Customer name if provided"),
      customerEmail: z.string().optional().describe("Customer email if provided"),
    }),
  }
);

// ============================================================
// TOOL 5: GET CART CONTENTS
// ============================================================
export const getCartTool = tool(
  async ({ participantId }) => {
    try {
      console.log(`[Tool:get_cart] Participant: ${participantId}`);

      const cart = await Cart.findOne({ userId: participantId }).populate("products.productId");

      if (!cart || cart.products.length === 0) {
        return "🛒 Your cart is empty.\n\nBrowse our menu to add items!";
      }

      // PRE-FORMAT as Markdown
      const items = cart.products.map(p => {
        const name = p.productId?.name || "Item";
        const qty = p.quantity;
        const price = p.price * p.quantity;
        return `• **${name}** x${qty} - ${price} EGP`;
      }).join("\n");

      return `🛒 **Your Cart:**\n\n${items}\n\n**Total: ${cart.totalPrice} EGP**\n\nReady to checkout?`;
    } catch (error) {
      console.error("[Tool:get_cart] Error:", error);
      return "Error fetching cart. Please try again.";
    }
  },
  {
    name: "get_cart",
    description: "Get current cart contents for the customer. Use when customer asks what's in their cart or wants to review their order.",
    schema: z.object({
      participantId: z.string().describe("The guest ID or user ID"),
    }),
  }
);

// ============================================================
// TOOL 6: ADD TO CART
// ============================================================
export const addToCartTool = tool(
  async ({ participantId, productId, quantity, selectedOptions }) => {
    try {
      console.log(`[Tool:add_to_cart] Adding ${quantity}x ${productId} for ${participantId}`);

      // Find product
      const product = await getProductByIdService(productId);
      if (!product) {
        return JSON.stringify({
          success: false,
          message: "المنتج غير موجود",
          message_en: "Product not found",
        });
      }

      // Check stock
      if (product.stock < quantity) {
        return JSON.stringify({
          success: false,
          message: `الكمية المتاحة ${product.stock} فقط`,
          message_en: `Only ${product.stock} available in stock`,
        });
      }

      // Calculate final price with options
      let finalPrice = product.basePrice;
      const opts = selectedOptions || {};

      if (product.options && product.options.length > 0) {
        for (const opt of product.options) {
          const choiceName = opts[opt.name];
          if (choiceName) {
            const choice = opt.choices?.find((c) => c.label === choiceName);
            if (choice) {
              finalPrice += choice.priceDelta || 0;
            }
          } else if (opt.required) {
            return JSON.stringify({
              success: false,
              message: `يرجى اختيار ${opt.name_ar || opt.name}`,
              message_en: `Please select ${opt.name}`,
              requiredOption: opt.name,
              choices: opt.choices?.map((c) => c.label),
            });
          }
        }
      }

      // Get or create cart
      let cart = await Cart.findOne({ userId: participantId });
      if (!cart) {
        cart = new Cart({
          userId: participantId,
          products: [],
          totalPrice: 0,
        });
      }

      // Check if product with same options exists
      const existingIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === productId &&
          JSON.stringify(p.selectedOptions) === JSON.stringify(opts)
      );

      if (existingIndex !== -1) {
        // Update quantity
        cart.products[existingIndex].quantity += quantity;
        cart.totalPrice += finalPrice * quantity;
      } else {
        // Add new item
        cart.products.push({
          productId: product._id,
          quantity,
          selectedOptions: opts,
          price: finalPrice,
        });
        cart.totalPrice += finalPrice * quantity;
      }

      // Update product stock
      product.stock -= quantity;
      await product.save();
      await cart.save();

      return JSON.stringify({
        success: true,
        message: `تمت إضافة ${quantity}x ${product.name_ar || product.name} للسلة`,
        message_en: `Added ${quantity}x ${product.name} to cart`,
        addedItem: {
          name: product.name,
          name_ar: product.name_ar,
          quantity,
          price: finalPrice,
          totalPrice: finalPrice * quantity,
        },
        cartTotal: cart.totalPrice,
        cartItemCount: cart.products.reduce((sum, p) => sum + p.quantity, 0),
      });
    } catch (error) {
      console.error("[Tool:add_to_cart] Error:", error);
      return JSON.stringify({ success: false, error: "Failed to add to cart" });
    }
  },
  {
    name: "add_to_cart",
    description: "Add a product to the customer's cart. Use when customer wants to order something. Must provide product ID, quantity, and any required options.",
    schema: z.object({
      participantId: z.string().describe("The guest ID or user ID"),
      productId: z.string().describe("The product ID to add"),
      quantity: z.number().min(1).describe("Quantity to add"),
      selectedOptions: z.object({}).passthrough().optional()
        .describe("Selected options as object, e.g., { Size: Large }"),

    }),
  }
);

// ============================================================
// TOOL 7: UPDATE CART ITEM
// ============================================================
export const updateCartItemTool = tool(
  async ({ participantId, productId, newQuantity }) => {
    try {
      console.log(`[Tool:update_cart] Product: ${productId}, New Qty: ${newQuantity}`);

      const cart = await Cart.findOne({ userId: participantId });
      if (!cart) {
        return JSON.stringify({ success: false, message: "السلة فارغة" });
      }

      const itemIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId || p._id.toString() === productId
      );

      if (itemIndex === -1) {
        return JSON.stringify({ success: false, message: "المنتج غير موجود في السلة" });
      }

      const item = cart.products[itemIndex];
      const product = await getProductByIdService(item.productId);
      const oldQuantity = item.quantity;
      const quantityDiff = newQuantity - oldQuantity;

      // If removing (quantity = 0)
      if (newQuantity <= 0) {
        // Return stock
        if (product) {
          product.stock += oldQuantity;
          await product.save();
        }
        
        cart.totalPrice -= item.price * oldQuantity;
        cart.products.splice(itemIndex, 1);
        await cart.save();

        return JSON.stringify({
          success: true,
          message: "تم حذف المنتج من السلة",
          message_en: "Item removed from cart",
          cartTotal: cart.totalPrice,
          cartItemCount: cart.products.reduce((sum, p) => sum + p.quantity, 0),
        });
      }

      // Check stock for increase
      if (quantityDiff > 0 && product && product.stock < quantityDiff) {
        return JSON.stringify({
          success: false,
          message: `الكمية المتاحة ${product.stock + oldQuantity} فقط`,
        });
      }

      // Update quantity
      item.quantity = newQuantity;
      cart.totalPrice += item.price * quantityDiff;

      // Update stock
      if (product) {
        product.stock -= quantityDiff;
        await product.save();
      }

      await cart.save();

      return JSON.stringify({
        success: true,
        message: `تم تحديث الكمية إلى ${newQuantity}`,
        message_en: `Quantity updated to ${newQuantity}`,
        cartTotal: cart.totalPrice,
        cartItemCount: cart.products.reduce((sum, p) => sum + p.quantity, 0),
      });
    } catch (error) {
      console.error("[Tool:update_cart] Error:", error);
      return JSON.stringify({ success: false, error: "Failed to update cart" });
    }
  },
  {
    name: "update_cart_item",
    description: "Update quantity of an item in cart or remove it (set quantity to 0). Use when customer wants to change quantity or remove something.",
    schema: z.object({
      participantId: z.string().describe("The guest ID or user ID"),
      productId: z.string().describe("The product ID or cart item ID to update"),
      newQuantity: z.number().min(0).describe("New quantity (0 to remove)"),
    }),
  }
);

// ============================================================
// TOOL 8: VALIDATE COUPON
// ============================================================
export const validateCouponTool = tool(
  async ({ couponCode, orderTotal }) => {
    try {
      console.log(`[Tool:validate_coupon] Code: ${couponCode}, Total: ${orderTotal}`);

      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      if (!coupon) {
        return JSON.stringify({
          valid: false,
          message: "الكوبون غير موجود",
          message_en: "Coupon not found",
        });
      }

      if (!coupon.isActive) {
        return JSON.stringify({
          valid: false,
          message: "الكوبون غير نشط",
          message_en: "Coupon is not active",
        });
      }

      if (new Date() > coupon.expiresAt) {
        return JSON.stringify({
          valid: false,
          message: "الكوبون منتهي الصلاحية",
          message_en: "Coupon has expired",
        });
      }

      if (orderTotal < coupon.minOrderAmount) {
        return JSON.stringify({
          valid: false,
          message: `الحد الأدنى للطلب ${coupon.minOrderAmount} جنيه`,
          message_en: `Minimum order amount is ${coupon.minOrderAmount} EGP`,
        });
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === "percentage") {
        discount = (orderTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
        if (discount > orderTotal) {
          discount = orderTotal;
        }
      }

      discount = Math.round(discount * 100) / 100;

      return JSON.stringify({
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
        finalTotal: orderTotal - discount,
        message: `خصم ${discount} جنيه`,
        message_en: `Discount: ${discount} EGP`,
      });
    } catch (error) {
      console.error("[Tool:validate_coupon] Error:", error);
      return JSON.stringify({ valid: false, error: "Error validating coupon" });
    }
  },
  {
    name: "validate_coupon",
    description: "Check if a coupon code is valid and calculate the discount. Use when customer provides a coupon or promo code.",
    schema: z.object({
      couponCode: z.string().describe("The coupon code to validate"),
      orderTotal: z.number().describe("The order total before discount"),
    }),
  }
);

// ============================================================
// TOOL 9: GET SUGGESTIONS
// ============================================================
export const getSuggestionsTool = tool(
  async ({ participantId }) => {
    try {
      console.log(`[Tool:get_suggestions] For: ${participantId}`);

      const cart = await Cart.findOne({ userId: participantId }).populate("products.productId");

      if (!cart || cart.products.length === 0) {
        // Suggest popular items
        const popular = await Product.find({ stock: { $gt: 0 } })
          .sort({ productPoints: -1 })
          .limit(3)
          .select("name name_ar basePrice imgURL");

        return JSON.stringify({
          based_on: "popular",
          suggestions: popular.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            name_ar: p.name_ar,
            price: p.basePrice,
            image: p.imgURL,
          })),
        });
      }

      // Get categories of items in cart
      const cartCategories = [...new Set(
        cart.products.map((p) => p.productId?.categoryId?.toString()).filter(Boolean)
      )];

      // Find related products from same categories
      const suggestions = await Product.find({
        categoryId: { $in: cartCategories },
        _id: { $nin: cart.products.map((p) => p.productId._id) },
        stock: { $gt: 0 },
      })
        .limit(3)
        .select("name name_ar basePrice imgURL");

      return JSON.stringify({
        based_on: "cart",
        suggestions: suggestions.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          name_ar: p.name_ar,
          price: p.basePrice,
          image: p.imgURL,
        })),
      });
    } catch (error) {
      console.error("[Tool:get_suggestions] Error:", error);
      return JSON.stringify({ suggestions: [] });
    }
  },
  {
    name: "get_suggestions",
    description: "Get product suggestions based on customer's cart or popular items. Use to recommend additional items.",
    schema: z.object({
      participantId: z.string().describe("The guest ID or user ID"),
    }),
  }
);

// ============================================================
// TOOL 10: CREATE ORDER
// ============================================================
export const createOrderTool = tool(
  async ({
    participantId,
    participantType,
    userId,
    serviceType,
    tableNumber,
    deliveryAddress,
    couponCode,
    paymentMethod,
    customerInfo,
  }) => {
    try {
      console.log(`[Tool:create_order] Creating order for: ${participantId}`);

      // Get cart
      const cart = await Cart.findOne({ userId: participantId }).populate("products.productId");
      if (!cart || cart.products.length === 0) {
        return JSON.stringify({
          success: false,
          message: "السلة فارغة، يرجى إضافة منتجات أولاً",
          message_en: "Cart is empty. Please add items first.",
        });
      }

      // Format items
      const items = cart.products.map((p) => ({
        productId: p.productId._id,
        name: p.productId.name,
        image: p.productId.imgURL || "",
        quantity: p.quantity,
        selectedOptions: p.selectedOptions || {},
        price: p.price,
        totalPrice: p.price * p.quantity,
        totalPoints: (p.productId.productPoints || 0) * p.quantity,
      }));

      // Calculate totals
      const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
      const vat = subtotal * 0.14;
      let discount = 0;
      let appliedCoupon = null;

      // Apply coupon if provided
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon && coupon.isActive && new Date() <= coupon.expiresAt) {
          if (coupon.discountType === "percentage") {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = coupon.discountValue;
          }
          appliedCoupon = coupon.code;
        }
      }

      const totalAmount = subtotal + vat - discount;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create order
      const order = await Order.create({
        orderNumber,
        customerId: participantId,
        customerType: participantType || "guest",
        user: participantType === "registered" ? userId : null,
        serviceType,
        tableNumber: serviceType === "dine-in" ? tableNumber : null,
        deliveryAddress: serviceType === "delivery" ? deliveryAddress : null,
        items,
        subtotal,
        vat,
        discount,
        totalAmount,
        paymentMethod: paymentMethod || "cash",
        paymentStatus: paymentMethod === "instore" ? "pending" : "pending",
        status: "pending",
        couponCode: appliedCoupon,
        customerInfo: customerInfo || {},
      });

      // Clear cart
      cart.products = [];
      cart.totalPrice = 0;
      await cart.save();

      // PRE-FORMAT as Markdown confirmation
      const confirmationMsg = `✅ **Order Confirmed!**

🧾 **Order #${order.orderNumber}**

📋 **Summary:**
${items.map(i => `• ${i.name} x${i.quantity} - ${i.totalPrice} EGP`).join("\n")}

💰 **Totals:**
• Subtotal: ${subtotal} EGP
• VAT (14%): ${Math.round(vat * 100) / 100} EGP
${discount > 0 ? `• Discount: -${discount} EGP\n` : ""}• **Total: ${Math.round(totalAmount * 100) / 100} EGP**

🚀 **Service:** ${serviceType}
💳 **Payment:** ${paymentMethod === "online" ? "Online (Stripe)" : "Pay at counter"}

Thank you for your order! 🎉`;

      return JSON.stringify({
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paymentMethod,
        serviceType,
        message: confirmationMsg,
      });
    } catch (error) {
      console.error("[Tool:create_order] Error:", error);
      return JSON.stringify({ success: false, error: error.message });
    }
  },
  {
    name: "create_order",
    description: "Create a final order from the customer's cart. Use ONLY when customer confirms they want to place the order. Requires service type and payment method.",
    schema: z.object({
      participantId: z.string().describe("The guest ID or user ID"),
      participantType: z.enum(["guest", "registered"]).describe("Whether guest or registered user"),
      userId: z.string().optional().describe("MongoDB User ID if registered"),
      serviceType: z.enum(["dine-in", "pickup", "delivery"]).describe("Service type"),
      tableNumber: z.string().optional().describe("Table number for dine-in"),
      deliveryAddress: z
        .object({
          address: z.string().optional(),
          lat: z.number().optional(),
          lng: z.number().optional(),
          notes: z.string().optional(),
        })
        .optional()
        .describe("Delivery address for delivery orders (required only for delivery)"),
      couponCode: z.string().optional().describe("Coupon code if any"),
      paymentMethod: z.enum(["online", "instore"]).describe("Payment method"),
      customerInfo: z
        .object({
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
        })
        .optional()
        .describe("Customer contact info"),
    }),
  }
);

// ============================================================
// TOOL 11: INITIATE PAYMENT
// ============================================================
export const initiatePaymentTool = tool(
  async ({ orderId }) => {
    try {
      console.log(`[Tool:initiate_payment] Order: ${orderId}`);

      const order = await Order.findById(orderId);
      if (!order) {
        return JSON.stringify({
          success: false,
          message: "الطلب غير موجود",
          message_en: "Order not found",
        });
      }

      if (order.paymentMethod !== "online") {
        return JSON.stringify({
          success: false,
          message: "هذا الطلب للدفع في المطعم",
          message_en: "This order is for in-store payment",
        });
      }

      // Create Stripe checkout session
      const session = await PaymentService.createCheckoutSession(orderId);

      return JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        message: "جاري تحويلك لصفحة الدفع...",
        message_en: "Redirecting to payment page...",
      });
    } catch (error) {
      console.error("[Tool:initiate_payment] Error:", error);
      return JSON.stringify({ success: false, error: "Failed to initiate payment" });
    }
  },
  {
    name: "initiate_payment",
    description: "Start online payment process for an order. Returns Stripe checkout URL. Use after order is created with online payment method.",
    schema: z.object({
      orderId: z.string().describe("The order ID to pay for"),
    }),
  }
);

// ============================================================
// TOOL 12: WEBSITE GUIDE
// ============================================================
export const websiteGuideTool = tool(
  async ({ topic }) => {
    const guides = {
      ordering: {
        ar: `لطلب أوردر من الموقع:
1. افتح المنيو واختار المنتجات اللي عاوزها
2. اضغط على "أضف للسلة" لكل منتج
3. لما تخلص، روح للسلة وراجع طلبك
4. اختار نوع الخدمة (أكل في المطعم / استلام / توصيل)
5. ادخل معلوماتك واختار طريقة الدفع
6. اضغط "تأكيد الطلب"`,
        en: `To place an order:
1. Browse the menu and select products
2. Click "Add to Cart" for each item
3. Go to cart and review your order
4. Select service type (Dine-in / Pickup / Delivery)
5. Enter your info and choose payment method
6. Click "Confirm Order"`,
      },
      menu: {
        ar: "يمكنك تصفح المنيو من الصفحة الرئيسية أو من خلال قسم 'المنيو'. المنتجات مقسمة حسب الفئات.",
        en: "You can browse the menu from the home page or the 'Menu' section. Products are organized by categories.",
      },
      payment: {
        ar: "نقبل الدفع أونلاين (فيزا/ماستركارد) أو الدفع عند الاستلام في المطعم.",
        en: "We accept online payment (Visa/Mastercard) or cash payment in-store.",
      },
      account: {
        ar: "يمكنك إنشاء حساب للحصول على نقاط المكافآت وتتبع طلباتك.",
        en: "Create an account to earn reward points and track your orders.",
      },
    };

    const guide = guides[topic] || guides.ordering;
    return JSON.stringify({ topic, guide });
  },
  {
    name: "website_guide",
    description: "Explain how to use the website features. Use when customer asks how to do something on the website.",
    schema: z.object({
      topic: z.enum(["ordering", "menu", "payment", "account"]).describe("Topic to explain"),
    }),
  }
);

// ============================================================
// EXPORT ALL TOOLS
// ============================================================
export const allTools = [
  menuSearchTool,
  getCategoriesList,
  restaurantInfoTool,
  submitSupportTool,
  getCartTool,
  addToCartTool,
  updateCartItemTool,
  validateCouponTool,
  getSuggestionsTool,
  createOrderTool,
  initiatePaymentTool,
  websiteGuideTool,
];

// Tools for different conversation states (to reduce context)
export const greetingTools = [menuSearchTool, getCategoriesList, restaurantInfoTool, websiteGuideTool];
export const browsingTools = [menuSearchTool, getCategoriesList, restaurantInfoTool, getCartTool, addToCartTool];
export const orderingTools = [menuSearchTool, getCartTool, addToCartTool, updateCartItemTool, getSuggestionsTool];
export const checkoutTools = [getCartTool, validateCouponTool, createOrderTool];
export const paymentTools = [initiatePaymentTool];
export const supportTools = [submitSupportTool, restaurantInfoTool];