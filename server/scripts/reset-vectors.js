import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/modules/product/Product.js"; 
import { embeddingsModel } from "../src/config/ai.js"; 
import { env } from "../src/config/env.js";

dotenv.config();

async function resetVectors() {
  try {
    console.log("🔌 Connecting to DB...");
    await mongoose.connect(env.mongoUri);

    const products = await Product.find({});
    console.log(`📦 Processing ${products.length} products...`);

    for (const p of products) {
      // Data Sanitization: Ensure no undefined values in text
      const nameAr = p.name_ar || "";
      const descAr = p.desc_ar || "";
      const tags = p.tags ? p.tags.join(", ") : ""; 
      
      const optionsText = (p.options && p.options.length > 0) 
        ? p.options.map(o => `${o.name} (${o.name_ar || ''})`).join(", ") 
        : "";

      // Create rich text for embedding
      const textToEmbed = `
        Item: ${p.name} | ${nameAr}
        Desc: ${p.desc} | ${descAr}
        Price: ${p.basePrice}
        Tags: ${tags}
        Category: ${p.categoryId}
        Options: ${optionsText}
      `.replace(/\s+/g, " ").trim(); 

      console.log(`🔹 Embedding: ${p.name}`);

      // Generate Vector (384 dims)
      const vector = await embeddingsModel.embedQuery(textToEmbed);
      
      // ---------------------------------------------------------
      // 🛠️ THE FIX: Use updateOne instead of save()
      // This bypasses validation for missing fields (like name_ar)
      // ---------------------------------------------------------
      await Product.updateOne(
        { _id: p._id }, 
        { $set: { embedding: vector } }
      );
      // ---------------------------------------------------------
    }

    console.log("🎉 Done! All products embedded (Validation skipped).");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

resetVectors();