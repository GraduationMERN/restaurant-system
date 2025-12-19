import Restaurant from "./restaurant.model.js";

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
