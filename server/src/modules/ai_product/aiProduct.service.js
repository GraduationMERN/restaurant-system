import axios from "axios";
import { z } from "zod";
import { env } from "../../config/env.js";
import { getAllCategoriesRepo } from "../category/category.repository.js";

// Output schema validation for AI response (lenient: optional fields with fallbacks)
const schema = z.object({
    name: z.string().optional(),
    name_ar: z.string().optional(),
    ingredients: z.array(z.string()).min(1).optional(),
    description: z.string().optional(),
    description_ar: z.string().optional(),
    basePrice: z.number().min(0).optional(),
    category: z.string().optional(),
    stock: z.number().int().min(2).optional(),
    isNew: z.boolean().optional(),
    productPoints: z.number().int().min(0).optional(),
    pointsToPay: z.number().int().min(0).optional(),
});

async function fetchImage(url) {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = Buffer.from(res.data, "binary").toString("base64");
    const mime = res.headers["content-type"] || "image/jpeg";
    return { base64, mime };
}

export async function analyzeProductImage(imageUrl) {
    const { base64, mime } = await fetchImage(imageUrl);

    const apiKey = env.geminiApiKey;
    const model = env.geminiModel;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    // Fetch categories to guide the LLM to choose one of the existing ones
    const categories = await getAllCategoriesRepo();
    const categoryNames = (categories || []).map(c => c.name).filter(Boolean);

    // Prompt asks for bilingual fields, random points, and valid stock/isNew
    const prompt =
        `Analyze this restaurant meal image and return ONLY raw JSON with these keys:
{
  "name": "<English name>",
  "name_ar": "<Arabic name>",
  "ingredients": ["<ingredient>", "..."],
  "description": "<English marketing description>",
  "description_ar": "<Arabic marketing description>",
  "basePrice": <number in EGP>,
  "category": "<one of: ${categoryNames.join(", ")}>",
  "stock": <integer >= 2>,
  "isNew": true,
  "productPoints": <random positive integer>,
  "pointsToPay": <random positive integer>
}
Rules:
- Category MUST be chosen from the provided list.
- Return ONLY JSON; no markdown or code fences.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { data: base64, mimeType: mime } },
                ],
            },
        ],
        generationConfig: { temperature: 0.4 },
    };

    const res = await axios.post(url, body);
    const candidates = res.data?.candidates || [];
    const text = candidates[0]?.content?.parts?.[0]?.text || "";

    let jsonText = text;
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch && fenceMatch[1]) {
        jsonText = fenceMatch[1];
    }
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch {
        console.log(text);
        throw new Error("Model did not return valid JSON");
    }
    const safe = schema.parse({
        name: parsed.name,
        name_ar: parsed.name_ar,
        ingredients: parsed.ingredients,
        description: parsed.description,
        description_ar: parsed.description_ar,
        basePrice: parsed.basePrice != null ? Number(parsed.basePrice) : undefined,
        category: parsed.category,
        stock: parsed.stock != null ? Number(parsed.stock) : undefined,
        isNew: parsed.isNew,
        productPoints: parsed.productPoints != null ? Number(parsed.productPoints) : undefined,
        pointsToPay: parsed.pointsToPay != null ? Number(parsed.pointsToPay) : undefined,
    });

    // Random fallback helpers
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pickCategory = () => {
        const input = String(safe.category || parsed.category || "").trim().toLowerCase();
        if (!categoryNames.length) return input || "General";
        // Fuzzy match against available categories
        const match = categoryNames.find(n => {
            const nn = String(n).toLowerCase();
            return nn === input || nn.includes(input) || input.includes(nn);
        });
        return match || categoryNames[0];
    };

    const productDraft = {
        name: safe.name || "",
        name_ar: safe.name_ar || "",
        desc: safe.description || "",
        desc_ar: safe.description_ar || "",
        basePrice: typeof safe.basePrice === "number" ? safe.basePrice : 0,
        imgURL: imageUrl,
        categoryName: pickCategory(),
        categoryId: null,
        stock: typeof safe.stock === "number" && safe.stock >= 2 ? safe.stock : randInt(2, 20),
        isnew: safe.isNew === true ? true : true,
        productPoints: typeof safe.productPoints === "number" ? safe.productPoints : randInt(10, 500),
        pointsToPay: typeof safe.pointsToPay === "number" ? safe.pointsToPay : randInt(5, 200),
        tags: Array.isArray(safe.ingredients) ? safe.ingredients : [],
        options: [],
    };

    return productDraft;
}
