// restaurant.controller.js - ENHANCED VERSION
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
    
    console.log('=== UPDATE SYSTEM CATEGORY DEBUG ===');
    console.log('Category:', category);
    console.log('Received data:', JSON.stringify(categoryData, null, 2));
    
    const updated = await restaurantService.updateSystemCategory(category, categoryData);
    
    console.log('Updated category data:', JSON.stringify(updated.systemSettings?.[category], null, 2));
    
    res.status(200).json({
      success: true,
      message: `${category} settings updated successfully`,
      data: updated.systemSettings[category],  // ← This returns ONLY the category data
    });
  } catch (error) {
    console.error(`Error updating ${req.params.category} settings:`, error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to save settings"
    });
  }
}

// Landing Page Specific Controllers
export async function getLandingSettings(req, res) {
  try {
    const landingSettings = await restaurantService.getLandingSettings();
    res.status(200).json({
      success: true,
      data: landingSettings,
    });
  } catch (error) {
    console.error("Error fetching landing settings:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function updateLandingSettings(req, res) {
  try {
    const landingData = req.body;
    const updated = await restaurantService.updateLandingSettings(landingData);
    res.status(200).json({
      success: true,
      message: "Landing page settings updated successfully",
      data: updated.systemSettings?.landing,
    });
  } catch (error) {
    console.error("Error updating landing settings:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function resetLandingPage(req, res) {
  try {
    const updated = await restaurantService.resetLandingPage();
    res.status(200).json({
      success: true,
      message: "Landing page reset to defaults",
      data: updated.systemSettings?.landing,
    });
  } catch (error) {
    console.error("Error resetting landing page:", error);
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
    const paymentMethods = Array.isArray(updated) ? updated : (updated?.paymentMethods || updated);
    res.status(201).json({ success: true, message: "Payment method added successfully", data: paymentMethods });
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
    if (!updated) return res.status(404).json({ success: false, message: 'Payment method not found' });

    // updated may be the updated item, or the array; return updated item and current list
    const updatedItem = Array.isArray(updated) ? updated.find(i => String(i._id) === String(methodId)) : updated;
    const restaurant = await restaurantService.getRestaurant();

    res.status(200).json({ success: true, message: 'Payment method updated successfully', data: { updatedItem, paymentMethods: restaurant.paymentMethods } });
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
    if (!updated) return res.status(404).json({ success: false, message: 'Payment method not found' });

    const paymentMethods = Array.isArray(updated) ? updated : (updated?.paymentMethods || updated);
    res.status(200).json({ success: true, message: 'Payment method removed successfully', data: paymentMethods });
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
    if (!updated) return res.status(404).json({ success: false, message: 'Payment method not found' });

    const updatedItem = Array.isArray(updated) ? updated.find(i => String(i._id) === String(methodId)) : updated;
    const restaurant = await restaurantService.getRestaurant();
    res.status(200).json({ success: true, message: `Payment method ${enabled ? 'enabled' : 'disabled'} successfully`, data: { updatedItem, paymentMethods: restaurant.paymentMethods } });
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
    // service returns updated array
    const faqs = Array.isArray(updated) ? updated : (updated?.faqs || updated);
    const added = faqs[faqs.length - 1] || null;
    res.status(201).json({ success: true, message: 'FAQ added successfully', data: added });
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
    // updateFAQ returns the updated item
    const updatedItem = updated && updated._id ? updated : null;
    res.status(200).json({ success: true, message: 'FAQ updated successfully', data: updatedItem });
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
    const faqs = Array.isArray(updated) ? updated : (updated?.faqs || updated);
    res.status(200).json({ success: true, message: 'FAQ removed successfully', data: faqs });
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

export async function importSettings(req, res) {
  try {
    const { settings, options } = req.body;
    if (!settings) {
      return res.status(400).json({ success: false, message: "Missing settings payload" });
    }

    const updated = await restaurantService.importSettings(settings, options || { overwrite: false });
    res.status(200).json({ success: true, message: "Settings imported successfully", data: updated });
  } catch (error) {
    console.error("Error importing settings:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
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

    const result = await fileUploadService.uploadLogo(req.file);
    const logoUrl = result?.url || result;
    const restaurant = result?.restaurant || await restaurantService.getRestaurant();

    res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      data: { logoUrl, restaurant },
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

    const result = await fileUploadService.uploadMenuImage(req.file);
    const menuImageUrl = result?.url || result;
    const restaurant = result?.restaurant || await restaurantService.getRestaurant();

    res.status(200).json({ success: true, message: "Menu image uploaded successfully", data: { menuImageUrl, restaurant } });
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

// Landing page image upload
export async function uploadLandingImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    // Accept an optional target path to determine where to place the image
    const target = req.body?.target || req.query?.target || 'hero.image';
    const result = await fileUploadService.uploadLandingImage(target, req.file);
    const imageUrl = result?.url || result;

    res.status(200).json({ success: true, message: "Landing image uploaded successfully", data: { imageUrl } });
  } catch (error) {
    console.error("Error uploading landing image:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
}

export async function uploadFavicon(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await fileUploadService.uploadFavicon(req.file);
    const faviconUrl = result?.url || result;
    const restaurant = result?.restaurant || await restaurantService.getRestaurant();

    res.status(200).json({ success: true, message: 'Favicon uploaded successfully', data: { faviconUrl, restaurant } });
  } catch (error) {
    console.error('Error uploading favicon:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}

// Import Instagram posts into landing settings (admin only)
export async function importInstagramPosts(req, res) {
  try {
    const { username, count } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'Missing username' });

    // Support preview mode: ?persist=false will fetch posts but NOT save to DB
    const persist = req.query?.persist !== 'false';

    // Use instagramService directly for preview (no DB write)
    const instagramService = (await import('./instagram.service.js')).default;
    const posts = await instagramService.fetchPosts({ username, count: Number(count) || 8 });

    if (!persist) {
      return res.status(200).json({ success: true, message: 'Fetched Instagram posts (preview)', data: { instagram: { posts } } });
    }

    // Persist into landing settings
    const updated = await restaurantService.importInstagramPosts({ username, count: Number(count) || 8 });
    res.status(200).json({ success: true, message: 'Imported Instagram posts', data: updated.systemSettings?.landing });
  } catch (error) {
    console.error('Error importing instagram posts:', error);
    const msg = error?.message || '';
    // Return 400 for configuration or upstream API errors with helpful message
    if (msg.includes('not configured') || msg.includes('No fetch available') || msg.includes('Instagram API error')) {
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: msg || 'Failed to import Instagram posts' });
  }
}