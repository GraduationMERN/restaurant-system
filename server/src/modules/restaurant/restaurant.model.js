// restaurant.repository.js
import Restaurant from "./restaurant.model.js";

class RestaurantRepository {
  // ======================
  // BASIC CRUD OPERATIONS
  // ======================
  
  // Find single restaurant (since you have only one)
  async findOne() {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
  }

  // Find restaurant by ID
  async findById(id) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
  }

  // Find restaurant by subdomain
  async findBySubdomain(subdomain) {
    const restaurant = await Restaurant.findOne({
      "websiteDesign.domain.subdomain": subdomain,
      isActive: true,
    });
    if (!restaurant) {
      throw new Error("Restaurant not found or inactive");
    }
    return restaurant;
  }

  // Update restaurant
  async update(id, updateData) {
    const restaurant = await Restaurant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
  }

  // Update restaurant directly (without ID)
  async updateRestaurant(updateData) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    
    Object.assign(restaurant, updateData);
    return await restaurant.save();
  }

  // ======================
  // ARRAY OPERATIONS
  // ======================
  
  // Add to array (paymentMethods, faqs)
  async addToArray(arrayField, item) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    restaurant[arrayField].push(item);
    await restaurant.save();
    
    // Return the updated array
    return restaurant[arrayField];
  }

  // Remove from array by index
  async removeFromArrayByIndex(arrayField, index) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    if (index < 0 || index >= restaurant[arrayField].length) {
      throw new Error(`Invalid index for ${arrayField}: ${index}`);
    }

    restaurant[arrayField].splice(index, 1);
    await restaurant.save();
    
    // Return the updated array
    return restaurant[arrayField];
  }

  // Remove from array by ID (for FAQs which have _id)
  async removeFromArrayById(arrayField, itemId) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const initialLength = restaurant[arrayField].length;
    restaurant[arrayField] = restaurant[arrayField].filter(
      item => item._id.toString() !== itemId
    );
    
    if (restaurant[arrayField].length === initialLength) {
      throw new Error(`Item not found in ${arrayField}: ${itemId}`);
    }

    await restaurant.save();
    return restaurant[arrayField];
  }

  // Update item in array by index
  async updateInArrayByIndex(arrayField, index, updates) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    if (index < 0 || index >= restaurant[arrayField].length) {
      throw new Error(`Invalid index for ${arrayField}: ${index}`);
    }

    restaurant[arrayField][index] = {
      ...restaurant[arrayField][index],
      ...updates,
    };

    restaurant.markModified(arrayField);
    await restaurant.save();
    
    // Return the updated item
    return restaurant[arrayField][index];
  }

  // Update item in array by ID (for FAQs)
  async updateInArrayById(arrayField, itemId, updates) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const itemIndex = restaurant[arrayField].findIndex(
      item => item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      throw new Error(`Item not found in ${arrayField}: ${itemId}`);
    }

    restaurant[arrayField][itemIndex] = {
      ...restaurant[arrayField][itemIndex].toObject(),
      ...updates,
    };

    restaurant.markModified(arrayField);
    await restaurant.save();
    
    // Return the updated item
    return restaurant[arrayField][itemIndex];
  }

  // Find index in array by identifier
  async findIndexInArray(arrayField, identifier, value) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    return restaurant[arrayField].findIndex(item => 
      item[identifier] === value
    );
  }

  // Find item in array by ID
  async findInArrayById(arrayField, itemId) {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    return restaurant[arrayField].find(
      item => item._id.toString() === itemId
    );
  }

  // ======================
  // UTILITY METHODS
  // ======================
  
  // Get restaurant ID
  async getRestaurantId() {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant._id;
  }

  // Check if restaurant exists
  async exists() {
    const count = await Restaurant.countDocuments();
    return count > 0;
  }

  // Create initial restaurant (if doesn't exist)
  async createInitial(restaurantData) {
    const exists = await this.exists();
    if (exists) {
      throw new Error("Restaurant already exists");
    }
    
    const restaurant = new Restaurant(restaurantData);
    return await restaurant.save();
  }
}

export default new RestaurantRepository();