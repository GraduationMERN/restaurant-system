// settings.service.js
import restaurantRepository from "./restaurant.repository.js";

class SettingsService {
  // ========== SERVICE SETTINGS ==========
  async getServiceSettings() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant.services || {};
  }

  async updateServices(services) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const updateData = {
      services: {
        ...restaurant.services,
        ...services,
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  async toggleService(service, enabled) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    if (!restaurant.services[service]) {
      throw new Error(`Invalid service: ${service}`);
    }

    const updateData = {
      services: {
        ...restaurant.services,
        [service]: {
          ...restaurant.services[service],
          enabled,
        },
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  // ========== PAYMENT SETTINGS ==========
  async getPaymentSettings() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant.paymentMethods || [];
  }

  async addPaymentMethod(method) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Check if exists (case insensitive)
    const exists = restaurant.paymentMethods.find(
      pm => pm.name.toLowerCase() === method.name.toLowerCase()
    );
    
    if (exists) {
      throw new Error("Payment method already exists");
    }

    return await restaurantRepository.addToArray("paymentMethods", method);
  }

  async updatePaymentMethod(methodId, updates) {
    // Since paymentMethods don't have _id, we need to find by index
    // In real implementation, methodId would be the index or we'd need a different approach
    // For now, let's assume methodId is the index
    const index = parseInt(methodId);
    if (isNaN(index)) {
      throw new Error("Invalid payment method ID");
    }

    return await restaurantRepository.updateInArrayByIndex("paymentMethods", index, updates);
  }

  async removePaymentMethod(methodId) {
    // methodId is the index since no _id
    const index = parseInt(methodId);
    if (isNaN(index)) {
      throw new Error("Invalid payment method ID");
    }

    return await restaurantRepository.removeFromArrayByIndex("paymentMethods", index);
  }

  async togglePaymentMethod(methodId, enabled) {
    return await this.updatePaymentMethod(methodId, { enabled });
  }

  // ========== WEBSITE DESIGN ==========
  async getWebsiteDesign() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant.websiteDesign || {};
  }

  async updateWebsiteDesign(design) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const updateData = {
      websiteDesign: {
        ...restaurant.websiteDesign,
        ...design,
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  async updateWebsiteColors(colors) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const updateData = {
      websiteDesign: {
        ...restaurant.websiteDesign,
        colors: {
          ...restaurant.websiteDesign.colors,
          ...colors,
        },
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  // ========== INTEGRATIONS ==========
  async getIntegrations() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant.integrations || {};
  }

  async updateIntegration(integration, settings) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    if (!restaurant.integrations[integration]) {
      throw new Error(`Invalid integration: ${integration}`);
    }

    const updateData = {
      integrations: {
        ...restaurant.integrations,
        [integration]: {
          ...restaurant.integrations[integration],
          ...settings,
        },
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }

  async toggleIntegration(integration, enabled) {
    return await this.updateIntegration(integration, { enabled });
  }

  // ========== CONTENT MANAGEMENT ==========
  async getFAQs() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant.faqs || [];
  }

  async updateFAQs(faqs) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const updateData = { faqs };
    return await restaurantRepository.update(restaurant._id, updateData);
  }

  async addFAQ(faq) {
    return await restaurantRepository.addToArray("faqs", faq);
  }

  async updateFAQ(faqId, faqUpdates) {
    // FAQs have _id, so we can use a different approach
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const faqIndex = restaurant.faqs.findIndex(f => f._id.toString() === faqId);
    if (faqIndex === -1) {
      throw new Error("FAQ not found");
    }

    restaurant.faqs[faqIndex] = {
      ...restaurant.faqs[faqIndex].toObject(),
      ...faqUpdates,
    };

    restaurant.markModified('faqs');
    return await restaurant.save();
  }

  async removeFAQ(faqId) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    restaurant.faqs = restaurant.faqs.filter(f => f._id.toString() !== faqId);
    return await restaurant.save();
  }

  async getPolicies() {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant.policies || {};
  }

  async updatePolicies(policies) {
    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const updateData = {
      policies: {
        ...restaurant.policies,
        ...policies,
      },
    };

    return await restaurantRepository.update(restaurant._id, updateData);
  }
}

export default new SettingsService();