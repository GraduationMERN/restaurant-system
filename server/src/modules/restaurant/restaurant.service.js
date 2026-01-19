// restaurant.service.js
import restaurantRepository from "./restaurant.repository.js";
import { translateRestaurantSettings } from "../../utils/translation.service.js";
import instagramService from "./instagram.service.js";

class RestaurantService {
  // Basic restaurant operations
  // `selector` can be { restaurantId } or { subdomain } or a mongo filter
  async getRestaurant(selector = {}) {
    return await restaurantRepository.findOne(selector);
  }

  async getRestaurantBySubdomain(subdomain) {
    return await restaurantRepository.findBySubdomain(subdomain);
  }

  async updateRestaurant(updateData, selector = {}) {
    try {
      // Auto-translate settings
      const translatedData = await translateRestaurantSettings(updateData);
      console.log("✅ Settings translated successfully");
      
      const restaurant = await restaurantRepository.findOne(selector);
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }
      return await restaurantRepository.update(restaurant._id, translatedData);
    } catch (translationError) {
      console.error("⚠️ Translation failed, saving without translation:", translationError.message);
      // Continue with original data
      const restaurant = await restaurantRepository.findOne(selector);
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }
      return await restaurantRepository.update(restaurant._id, updateData);
    }
  }

  // Branding operations
  async updateBranding(brandingData, selector = {}) {
    const restaurant = await restaurantRepository.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');

    const updateData = { branding: { ...restaurant.branding, ...brandingData } };
    return await restaurantRepository.update(restaurant._id, updateData);
  }

  // System settings operations
  async getSystemSettings(selector = {}) {
    const restaurant = await restaurantRepository.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');
    return restaurant.systemSettings || {};
  }

  async updateSystemSettings(systemSettings, selector = {}) {
    try {
      const restaurant = await restaurantRepository.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      // Use repository atomic updater for systemSettings
      return await restaurantRepository.updateSystemSettings(restaurant._id, systemSettings);
    } catch (err) {
      console.error('updateSystemSettings error', err);
      throw err;
    }
  }

  // Update specific system category
  async updateSystemCategory(category, categoryData, selector = {}) {
    try {
      const restaurant = await restaurantRepository.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      const payloadForCategory = categoryData && Object.prototype.hasOwnProperty.call(categoryData, category)
        ? categoryData[category]
        : categoryData;

      // Use repository atomic updater to set systemSettings.<category> fields
      const updates = { [category]: payloadForCategory };
      return await restaurantRepository.updateSystemSettings(restaurant._id, updates);
    } catch (err) {
      console.error('updateSystemCategory error', err);
      throw err;
    }
  }
  async getLandingSettings(selector = {}) {
    const restaurant = await restaurantRepository.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');
    return restaurant.systemSettings?.landing || {};
  }

  // Update landing settings
  async updateLandingSettings(landingData, selector = {}) {
    try {
      const restaurant = await restaurantRepository.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      // Use atomic updater to set landing fields
      const updates = { landing: { ...(landingData || {}) } };
      return await restaurantRepository.updateSystemSettings(restaurant._id, updates);
    } catch (err) {
      console.error('updateLandingSettings error', err);
      throw err;
    }
  }

  // Reset landing page to defaults
  async resetLandingPage(selector = {}) {
    try {
      const restaurant = await restaurantRepository.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      const defaultLanding = {
      hero: {
        title: "Welcome to Our Restaurant",
        titleAr: "مرحباً بكم في مطعمنا",
        subtitle: "Delicious food made with love",
        subtitleAr: "طعام لذيذ مصنوع بحب",
        image: "",
        enabled: true
      },
      about: {
        title: "About Us",
        titleAr: "من نحن",
        content: "",
        contentAr: "",
        image: "",
        enabled: true
      },
      testimonials: {
        items: [],
        featuredIds: [],
        mode: 'all',
        enabled: true
      },
      services: {
        enabled: true,
        items: []
      },
      contact: {
        email: "",
        phone: "",
        enabled: true
      },
      callUs: {
        number: "",
        numberAr: "",
        label: "Call Us",
        labelAr: "اتصل بنا",
        enabled: true
      },
      location: {
        address: "",
        addressAr: "",
        latitude: 0,
        longitude: 0,
        enabled: true
      },
      hours: {
        monday: { open: "11:00", close: "22:00", enabled: true },
        tuesday: { open: "11:00", close: "22:00", enabled: true },
        wednesday: { open: "11:00", close: "22:00", enabled: true },
        thursday: { open: "11:00", close: "22:00", enabled: true },
        friday: { open: "11:00", close: "23:00", enabled: true },
        saturday: { open: "10:00", close: "23:00", enabled: true },
        sunday: { open: "10:00", close: "22:00", enabled: true }
      },
      footer: {
        text: "",
        enabled: true
      },
      seo: {
        title: "",
        description: "",
        enabled: true
      },
      instagram: {
        enabled: false,
        posts: []
      },
      specialOffer: {
        enabled: true
      }
    };

      const updates = { landing: defaultLanding };
      return await restaurantRepository.updateSystemSettings(restaurant._id, updates);
    } catch (err) {
      console.error('resetLandingPage error', err);
      throw err;
    }
  }

  // Import Instagram posts and merge into landing.instagram.posts
  async importInstagramPosts({ username, count = 8 } = {}, selector = {}) {
    try {
      const posts = await instagramService.fetchPosts({ username, count });
      const restaurant = await restaurantRepository.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      // Merge: replace instagram.posts with fetched posts but keep enabled flag
      const currentLanding = restaurant.systemSettings?.landing || {};
      const updatedLanding = {
        ...currentLanding,
        instagram: {
          ...(currentLanding.instagram || {}),
          enabled: true,
          posts,
        }
      };

      const updates = { landing: updatedLanding };
      return await restaurantRepository.updateSystemSettings(restaurant._id, updates);
    } catch (err) {
      console.error('importInstagramPosts error', err);
      throw err;
    }
  }


  // Export all settings
  async exportSettings(selector = {}) {
    const restaurant = await restaurantRepository.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');

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
  async importSettings(settings, options = { overwrite: false }, selector = {}) {
    const restaurant = await restaurantRepository.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');

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