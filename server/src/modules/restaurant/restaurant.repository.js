// restaurant.repository.js
import Restaurant from "./restaurant.model.js";

class RestaurantRepository {
  // Find single restaurant (since you have only one)
  async findOne() {
    return await Restaurant.findOne();
  }

  // Find restaurant by ID
  async findById(id) {
    return await Restaurant.findById(id);
  }

  // Find restaurant by subdomain
  async findBySubdomain(subdomain) {
    return await Restaurant.findOne({
      "websiteDesign.domain.subdomain": subdomain,
      isActive: true,
    });
  }

  // Update restaurant
  async update(id, updateData) {
    return await Restaurant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  // Get the restaurant ID (since you only have one)
  async getRestaurantId() {
    const restaurant = await Restaurant.findOne();
    return restaurant ? restaurant._id : null;
  }

  // Add to array (paymentMethods, faqs)
  async addToArray(arrayField, item) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) return null;

    restaurant[arrayField].push(item);
    return await restaurant.save();
  }

  // Remove from array by index (since no _id in paymentMethods)
  async removeFromArrayByIndex(arrayField, index) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) return null;

    if (index < 0 || index >= restaurant[arrayField].length) {
      return null;
    }

    restaurant[arrayField].splice(index, 1);
    return await restaurant.save();
  }

  // Update item in array by index
  async updateInArrayByIndex(arrayField, index, updates) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) return null;

    if (index < 0 || index >= restaurant[arrayField].length) {
      return null;
    }

    restaurant[arrayField][index] = {
      ...restaurant[arrayField][index],
      ...updates,
    };

    restaurant.markModified(arrayField);
    return await restaurant.save();
  }

  // Find index in array by name or other identifier
  async findIndexInArray(arrayField, identifier, value) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) return -1;

    return restaurant[arrayField].findIndex(item => 
      item[identifier] === value
    );
  }
}

export default new RestaurantRepository();