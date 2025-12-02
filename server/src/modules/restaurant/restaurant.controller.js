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
