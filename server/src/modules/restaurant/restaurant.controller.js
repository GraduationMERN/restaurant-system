import Restaurant from "./restaurant.model.js";
import Product from "../product/Product.js";
import Category from "../category/Category.js";
import {
  generateMenuHTML,
  htmlToImage,
  uploadBufferToCloudinary,
  parsePromptOptions
} from "./menuGenerator.service.js";

export async function getRestaurant(req, res) {
  try {
    const restaurant = await Restaurant.findOne(); // only one
    res.status(200).json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateRestaurant(req, res) {
  try {
    const updateData = req.body;

    const restaurant = await Restaurant.findOne();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const updated = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      updateData,
      { new: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating restaurant settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function uploadLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // If using Cloudinary via multer-storage-cloudinary, multer exposes
    // `file.path` which is the public URL and `file.filename` as the public_id.
    const url =
      req.file.path ||
      `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const restaurant = await Restaurant.findOne();
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });

    // Update branding.logoUrl
    restaurant.branding = restaurant.branding || {};
    restaurant.branding.logoUrl = url;
    await restaurant.save();

    res
      .status(200)
      .json({ message: "Logo uploaded", logoUrl: url, restaurant });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function uploadMenuImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const url =
      req.file.path ||
      `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const restaurant = await Restaurant.findOne();
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });

    // Update branding.menuImage
    restaurant.branding = restaurant.branding || {};
    restaurant.branding.menuImage = url;
    await restaurant.save();

    res
      .status(200)
      .json({ message: "Menu image uploaded", menuImageUrl: url, restaurant });
  } catch (error) {
    console.error("Error uploading menu image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Generate a menu image from products in the database
 * Uses HTML template + Puppeteer to generate PNG image
 */
export async function generateMenuImage(req, res) {
  try {
    const { prompt } = req.body;

    // Fetch restaurant settings
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Fetch all categories
    const categories = await Category.find({}).lean();
    if (!categories.length) {
      return res.status(400).json({ 
        message: "No categories found. Please add categories first." 
      });
    }

    // Fetch all products
    const products = await Product.find({}).lean();
    if (!products.length) {
      return res.status(400).json({ 
        message: "No products found. Please add products first." 
      });
    }

    // Parse prompt options
    const options = parsePromptOptions(prompt);

    // Generate HTML menu
    const html = generateMenuHTML(products, categories, restaurant, options);

    // Convert HTML to image
    const imageBuffer = await htmlToImage(html);

    // Upload to Cloudinary
    const imageUrl = await uploadBufferToCloudinary(imageBuffer, "menu-images");

    // Update restaurant branding with new menu image
    restaurant.branding = restaurant.branding || {};
    restaurant.branding.menuImage = imageUrl;
    await restaurant.save();

    res.status(200).json({
      message: "Menu image generated successfully",
      menuImageUrl: imageUrl,
      restaurant
    });
  } catch (error) {
    console.error("Error generating menu image:", error);
    res.status(500).json({ 
      message: "Failed to generate menu image", 
      error: error.message 
    });
  }
}

