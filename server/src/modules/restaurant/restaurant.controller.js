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

export async function getBookingStatus(req, res) {
  try {
    const { restaurantId } = req.query;
    const restaurant = restaurantId ? await restaurantService.getRestaurantById(restaurantId) : await restaurantService.getRestaurant();
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const enabled = restaurant.services?.tableBookings?.enabled ?? false;
    const bookingSettings = restaurant.systemSettings?.bookingSettings || { maxPartySize: 10, maxAdvanceDays: 30, timeSlotInterval: 30 };
    res.status(200).json({ success: true, data: { enabled, bookingSettings } });
  } catch (err) {
    console.error('getBookingStatus failed', err);
    res.status(500).json({ success: false, message: err.message || 'Failed' });
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const settings = await restaurantService.getSystemSettings(selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await restaurantService.updateSystemSettings(systemSettings, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    console.log('=== UPDATE SYSTEM CATEGORY DEBUG ===');
    console.log('Category:', category);
    console.log('Received data:', JSON.stringify(categoryData, null, 2));
    
    const updated = await restaurantService.updateSystemCategory(category, categoryData, selector);
    
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

// Helper: Transform frontend format to backend format
function transformFrontendToBackend(frontendServices) {
  const backendServices = {};
  
  // Map frontend keys to backend keys
  if (frontendServices.pickup !== undefined) {
    backendServices.pickups = frontendServices.pickup;
  }
  if (frontendServices.delivery !== undefined) {
    backendServices.deliveries = frontendServices.delivery;
  }
  if (frontendServices.dineIn !== undefined) {
    backendServices.dineIns = frontendServices.dineIn;
  }
  if (frontendServices.tableBookings !== undefined) {
    backendServices.tableBookings = frontendServices.tableBookings;
  }
  
  return backendServices;
}

// Helper: Transform backend format to frontend format
function transformBackendToFrontend(backendServices) {
  const frontendServices = {};
  
  // Map backend keys to frontend keys
  if (backendServices.pickups !== undefined) {
    frontendServices.pickup = backendServices.pickups;
  }
  if (backendServices.deliveries !== undefined) {
    frontendServices.delivery = backendServices.deliveries;
  }
  if (backendServices.dineIns !== undefined) {
    frontendServices.dineIn = backendServices.dineIns;
  }
  if (backendServices.tableBookings !== undefined) {
    frontendServices.tableBookings = backendServices.tableBookings;
  }
  
  return frontendServices;
}

// Service White-label Controllers
export async function getServices(req, res) {
  try {
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const services = await settingsService.getServiceSettings(selector);
    console.log('=== GET SERVICES DEBUG ===');
    console.log('Backend services format:', JSON.stringify(services, null, 2));
    
    // Transform backend format to frontend format
    const frontendServices = transformBackendToFrontend(services);
    console.log('Transformed to frontend format:', JSON.stringify(frontendServices, null, 2));
    
    res.status(200).json({
      success: true,
      data: frontendServices,
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
    const frontendServices = req.body; // Frontend format
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    console.log('=== UPDATE SERVICES DEBUG ===');
    console.log('Received frontend services:', JSON.stringify(frontendServices, null, 2));
    
    // Transform frontend format to backend format
    const backendServices = transformFrontendToBackend(frontendServices);
    console.log('Transformed to backend format:', JSON.stringify(backendServices, null, 2));
    
    const updated = await settingsService.updateServices(backendServices, selector);
    console.log('Updated restaurant services:', JSON.stringify(updated.services, null, 2));
    
    // Transform response back to frontend format
    const responseData = transformBackendToFrontend(updated.services);
    
    res.status(200).json({
      success: true,
      message: "Services updated successfully",
      data: responseData,
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    const updated = await settingsService.toggleService(service, enabled, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const paymentMethods = await settingsService.getPaymentSettings(selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await settingsService.addPaymentMethod(method, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    console.log(`[DEBUG] updatePaymentMethod - methodId: ${methodId}, selector:`, selector, `updates:`, updates);
    
    const updated = await settingsService.updatePaymentMethod(methodId, updates, selector);
    if (!updated) return res.status(404).json({ success: false, message: 'Payment method not found' });

    // updated may be the updated item, or the array; return updated item and current list
    const updatedItem = Array.isArray(updated) ? updated.find(i => String(i._id) === String(methodId)) : updated;
    const restaurant = await restaurantService.getRestaurant(selector);

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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await settingsService.removePaymentMethod(methodId, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    const updated = await settingsService.togglePaymentMethod(methodId, enabled, selector);
    if (!updated) return res.status(404).json({ success: false, message: 'Payment method not found' });

    const updatedItem = Array.isArray(updated) ? updated.find(i => String(i._id) === String(methodId)) : updated;
    const restaurant = await restaurantService.getRestaurant(selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const design = await settingsService.getWebsiteDesign(selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await settingsService.updateWebsiteDesign(design, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await settingsService.updateWebsiteColors(colors, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const integrations = await settingsService.getIntegrations(selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    const updated = await settingsService.updateIntegration(integration, settings, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    const updated = await settingsService.toggleIntegration(integration, enabled, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const faqs = await settingsService.getFAQs(selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await settingsService.updateFAQs(faqs, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await settingsService.addFAQ(faq, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    const updated = await settingsService.updateFAQ(faqId, faq, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    
    const updated = await settingsService.removeFAQ(faqId, selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const policies = await settingsService.getPolicies(selector);
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
    const selector = req.user?.restaurantId ? { restaurantId: req.user.restaurantId } : {};
    const updated = await settingsService.updatePolicies(policies, selector);
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