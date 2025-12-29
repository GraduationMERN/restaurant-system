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

    // Ensure systemSettings object exists
    const currentSystem = restaurant.systemSettings || {};

    // Support payloads that may be nested (e.g. { branding: { ... } })
    const payloadForCategory = categoryData && Object.prototype.hasOwnProperty.call(categoryData, category)
      ? categoryData[category]
      : categoryData;

    const updateData = {
      systemSettings: {
        ...currentSystem,
        [category]: {
          ...currentSystem[category],
          ...payloadForCategory,
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

  // Import settings (merge or overwrite)
  async importSettings(settings, options = { overwrite: false }) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    let payload = {};
    if (options.overwrite) {
      // Overwrite major sections
      payload = {
        systemSettings: settings.systemSettings || {},
        services: settings.services || {},
        paymentMethods: settings.paymentMethods || [],
        websiteDesign: settings.websiteDesign || {},
        integrations: settings.integrations || {},
        branding: settings.branding || {},
        policies: settings.policies || {},
        faqs: settings.faqs || [],
        about: settings.about || {},
        support: settings.support || {},
        notifications: settings.notifications || {},
      };
    } else {
      // Merge into existing
      payload = {
        systemSettings: { ...restaurant.systemSettings, ...(settings.systemSettings || {}) },
        services: { ...restaurant.services, ...(settings.services || {}) },
        paymentMethods: settings.paymentMethods || restaurant.paymentMethods,
        websiteDesign: { ...restaurant.websiteDesign, ...(settings.websiteDesign || {}) },
        integrations: { ...restaurant.integrations, ...(settings.integrations || {}) },
        branding: { ...restaurant.branding, ...(settings.branding || {}) },
        policies: { ...restaurant.policies, ...(settings.policies || {}) },
        faqs: settings.faqs || restaurant.faqs,
        about: { ...restaurant.about, ...(settings.about || {}) },
        support: { ...restaurant.support, ...(settings.support || {}) },
        notifications: { ...restaurant.notifications, ...(settings.notifications || {}) },
      };
    }

    // Attempt translation where applicable
    try {
      const translated = await translateRestaurantSettings(payload);
      return await restaurantRepository.update(restaurant._id, translated);
    } catch (err) {
      // Fallback to raw payload
      return await restaurantRepository.update(restaurant._id, payload);
    }
  }
}

export default new RestaurantService();