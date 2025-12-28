// restaurant.controller.js
import restaurantService from "./restaurant.service.js";
import settingsService from "./settings.service.js";
import fileUploadService from "./fileUpload.service.js";
// Note: menuGeneratorService should be imported if it exists
// import menuGeneratorService from "./menuGenerator.service.js";

// Public Controllers
export async function getRestaurant(req, res) {
  try {
    const { subdomain } = req.params;
    
    if (subdomain) {
      // Get restaurant by subdomain (white-label access)
      const restaurant = await restaurantService.getRestaurantBySubdomain(subdomain);
      if (!restaurant) {
        return res.status(404).json({ 
          success: false,
          message: "Restaurant not found" 
        });
      }
      return res.status(200).json({
        success: true,
        data: restaurant.getPublicConfig(),
      });
    } else {
      // Get main restaurant
      const restaurant = await restaurantService.getRestaurant();
      if (!restaurant) {
        return res.status(404).json({ 
          success: false,
          message: "Restaurant not found" 
        });
      }
      
      // Return public or admin view based on authentication
      if (!req.user || req.user.role !== 'admin') {
        return res.status(200).json({
          success: true,
          data: restaurant.getPublicConfig(),
        });
      }
      
      return res.status(200).json({
        success: true,
        data: restaurant,
      });
    }
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateRestaurant(req, res) {
  try {
    const updateData = req.body;
    const updated = await restaurantService.updateRestaurant(updateData);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// System White-label Controllers
export async function getSystemSettings(req, res) {
  try {
    const settings = await restaurantService.getSystemSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateSystemSettings(req, res) {
  try {
    const { systemSettings } = req.body;
    const updated = await restaurantService.updateSystemSettings(systemSettings);
    res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: updated.systemSettings,
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateSystemCategory(req, res) {
  try {
    const { category } = req.params;
    const categoryData = req.body;
    
    const updated = await restaurantService.updateSystemCategory(category, categoryData);
    res.status(200).json({
      success: true,
      message: `${category} settings updated successfully`,
      data: updated.systemSettings[category],
    });
  } catch (error) {
    console.error(`Error updating ${req.params.category} settings:`, error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// Service White-label Controllers
export async function getServices(req, res) {
  try {
    const services = await settingsService.getServiceSettings();
    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateServices(req, res) {
  try {
    const services = req.body; // This should be the entire services object
    const updated = await settingsService.updateServices(services);
    res.status(200).json({
      success: true,
      message: "Services updated successfully",
      data: updated.services,
    });
  } catch (error) {
    console.error("Error updating services:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function toggleService(req, res) {
  try {
    const { service } = req.params;
    const { enabled } = req.body;
    
    const updated = await settingsService.toggleService(service, enabled);
    res.status(200).json({
      success: true,
      message: `Service ${service} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: updated.services[service],
    });
  } catch (error) {
    console.error(`Error toggling service ${req.params.service}:`, error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// Payment White-label Controllers
export async function getPaymentMethods(req, res) {
  try {
    const paymentMethods = await settingsService.getPaymentSettings();
    res.status(200).json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function addPaymentMethod(req, res) {
  try {
    const method = req.body;
    const updated = await settingsService.addPaymentMethod(method);
    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      data: updated.paymentMethods,
    });
  } catch (error) {
    console.error("Error adding payment method:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updatePaymentMethod(req, res) {
  try {
    const { methodId } = req.params;
    const updates = req.body;
    
    const updated = await settingsService.updatePaymentMethod(methodId, updates);
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: "Payment method not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      data: updated.paymentMethods,
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function removePaymentMethod(req, res) {
  try {
    const { methodId } = req.params;
    
    const updated = await settingsService.removePaymentMethod(methodId);
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: "Payment method not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Payment method removed successfully",
      data: updated.paymentMethods,
    });
  } catch (error) {
    console.error("Error removing payment method:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function togglePaymentMethod(req, res) {
  try {
    const { methodId } = req.params;
    const { enabled } = req.body;
    
    const updated = await settingsService.togglePaymentMethod(methodId, enabled);
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: "Payment method not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Payment method ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: updated.paymentMethods,
    });
  } catch (error) {
    console.error("Error toggling payment method:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// Website White-label Controllers
export async function getWebsiteDesign(req, res) {
  try {
    const design = await settingsService.getWebsiteDesign();
    res.status(200).json({
      success: true,
      data: design,
    });
  } catch (error) {
    console.error("Error fetching website design:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateWebsiteDesign(req, res) {
  try {
    const design = req.body;
    const updated = await settingsService.updateWebsiteDesign(design);
    res.status(200).json({
      success: true,
      message: "Website design updated successfully",
      data: updated.websiteDesign,
    });
  } catch (error) {
    console.error("Error updating website design:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateWebsiteColors(req, res) {
  try {
    const { colors } = req.body;
    const updated = await settingsService.updateWebsiteColors(colors);
    res.status(200).json({
      success: true,
      message: "Website colors updated successfully",
      data: updated.websiteDesign.colors,
    });
  } catch (error) {
    console.error("Error updating website colors:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// Integration White-label Controllers
export async function getIntegrations(req, res) {
  try {
    const integrations = await settingsService.getIntegrations();
    res.status(200).json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateIntegration(req, res) {
  try {
    const { integration } = req.params;
    const settings = req.body;
    
    const updated = await settingsService.updateIntegration(integration, settings);
    res.status(200).json({
      success: true,
      message: `${integration} integration updated successfully`,
      data: updated.integrations[integration],
    });
  } catch (error) {
    console.error(`Error updating ${integration} integration:`, error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function toggleIntegration(req, res) {
  try {
    const { integration } = req.params;
    const { enabled } = req.body;
    
    const updated = await settingsService.toggleIntegration(integration, enabled);
    res.status(200).json({
      success: true,
      message: `${integration} integration ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: updated.integrations[integration],
    });
  } catch (error) {
    console.error(`Error toggling ${integration} integration:`, error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// Content Controllers
export async function getFAQs(req, res) {
  try {
    const faqs = await settingsService.getFAQs();
    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateFAQs(req, res) {
  try {
    const { faqs } = req.body;
    const updated = await settingsService.updateFAQs(faqs);
    res.status(200).json({
      success: true,
      message: "FAQs updated successfully",
      data: updated.faqs,
    });
  } catch (error) {
    console.error("Error updating FAQs:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function addFAQ(req, res) {
  try {
    const faq = req.body;
    const updated = await settingsService.addFAQ(faq);
    res.status(201).json({
      success: true,
      message: "FAQ added successfully",
      data: updated.faqs[updated.faqs.length - 1],
    });
  } catch (error) {
    console.error("Error adding FAQ:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateFAQ(req, res) {
  try {
    const { faqId } = req.params;
    const faq = req.body;
    
    const updated = await settingsService.updateFAQ(faqId, faq);
    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: updated.faqs.find(f => f._id.toString() === faqId),
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function removeFAQ(req, res) {
  try {
    const { faqId } = req.params;
    
    const updated = await settingsService.removeFAQ(faqId);
    res.status(200).json({
      success: true,
      message: "FAQ removed successfully",
      data: updated.faqs,
    });
  } catch (error) {
    console.error("Error removing FAQ:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function getPolicies(req, res) {
  try {
    const policies = await settingsService.getPolicies();
    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    console.error("Error fetching policies:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updatePolicies(req, res) {
  try {
    const policies = req.body;
    const updated = await settingsService.updatePolicies(policies);
    res.status(200).json({
      success: true,
      message: "Policies updated successfully",
      data: updated.policies,
    });
  } catch (error) {
    console.error("Error updating policies:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// Bulk Operations
export async function exportSettings(req, res) {
  try {
    const exportData = await restaurantService.exportSettings();
    res.status(200).json({
      success: true,
      message: "Settings exported successfully",
      data: exportData,
    });
  } catch (error) {
    console.error("Error exporting settings:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

// File Upload Controllers
export async function uploadLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    const logoUrl = await fileUploadService.uploadLogo(req.file);
    const restaurant = await restaurantService.getRestaurant();
    
    res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      data: {
        logoUrl,
        restaurant,
      },
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function uploadMenuImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    const menuImageUrl = await fileUploadService.uploadMenuImage(req.file);
    const restaurant = await restaurantService.getRestaurant();
    
    res.status(200).json({
      success: true,
      message: "Menu image uploaded successfully",
      data: {
        menuImageUrl,
        restaurant,
      },
    });
  } catch (error) {
    console.error("Error uploading menu image:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function generateMenuImage(req, res) {
  try {
    const { prompt } = req.body;
    
    // Note: You need to import your actual menuGeneratorService
    // For now, I'll create a placeholder
    // const menuImageUrl = await menuGeneratorService.generateMenu(prompt);
    
    // Placeholder - replace with actual service call
    const menuImageUrl = "https://via.placeholder.com/800x600";
    
    // Update restaurant branding
    await restaurantService.updateBranding({ menuImage: menuImageUrl });
    
    const restaurant = await restaurantService.getRestaurant();
    
    res.status(200).json({
      success: true,
      message: "Menu image generated successfully",
      data: {
        menuImageUrl,
        restaurant,
      },
    });
  } catch (error) {
    console.error("Error generating menu image:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}