// restaurant.service.js
import restaurantRepository from "./restaurant.repository.js";
import { translateRestaurantSettings } from "../../utils/translation.service.js";

class RestaurantService {
  // Basic restaurant operations
  async getRestaurant() {
    return await restaurantRepository.findOne();
  }

  async getRestaurantBySubdomain(subdomain) {
    return await restaurantRepository.findBySubdomain(subdomain);
  }

  async updateRestaurant(updateData) {
    try {
      // Auto-translate settings
      const translatedData = await translateRestaurantSettings(updateData);
      console.log("✅ Settings translated successfully");
      
      const restaurant = await restaurantRepository.findOne();
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      return await restaurantRepository.update(restaurant._id, translatedData);
    } catch (translationError) {
      console.error("⚠️ Translation failed, saving without translation:", translationError.message);
      // Continue with original data
      const restaurant = await restaurantRepository.findOne();
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }
      return await restaurantRepository.update(restaurant._id, updateData);
    }
  }

  // Branding operations
  async updateBranding(brandingData) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const updateData = {
      branding: {
        ...restaurant.branding,
        ...brandingData,
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  // System settings operations
  async getSystemSettings() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant.systemSettings || {};
  }

  async updateSystemSettings(systemSettings) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const updateData = {
      systemSettings: {
        ...restaurant.systemSettings,
        ...systemSettings,
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  // Update specific system category
  async updateSystemCategory(category, categoryData) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Validate category exists
    if (!restaurant.systemSettings[category]) {
      throw new Error(`Invalid system category: ${category}`);
    }

    const updateData = {
      systemSettings: {
        ...restaurant.systemSettings,
        [category]: {
          ...restaurant.systemSettings[category],
          ...categoryData,
        },
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  // Export all settings
  async exportSettings() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    return {
      restaurantName: restaurant.restaurantName,
      systemSettings: restaurant.systemSettings,
      services: restaurant.services,
      paymentMethods: restaurant.paymentMethods,
      websiteDesign: restaurant.websiteDesign,
      integrations: restaurant.integrations,
      branding: restaurant.branding,
      policies: restaurant.policies,
      faqs: restaurant.faqs,
      about: restaurant.about,
      support: restaurant.support,
      notifications: restaurant.notifications,
      exportDate: new Date().toISOString(),
    };
  }
}

export default new RestaurantService();