import { analyzeProductImage } from "./aiProduct.service.js";

export async function analyzeImage(req, res) {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No image provided" });
    }

    const imageUrl = req.file.path;
    const data = await analyzeProductImage(imageUrl);

    return res.status(200).json({
      success: true,
      data,
      imageUrl,
    });
  } catch (err) {
    console.error("[AI Product] analyzeImage error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "AI analysis failed" });
  }
}

