// restaurant.route.js
import express from "express";
import {
  // Public routes
  getRestaurant,
  
  // System White-label
  getSystemSettings,
  updateSystemSettings,
  updateSystemCategory,
  
  // Service White-label
  getServices,
  updateServices,
  toggleService,
  
  // Payment White-label
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  togglePaymentMethod,
  
  // Website White-label
  getWebsiteDesign,
  updateWebsiteDesign,
  updateWebsiteColors,
  
  // Integration White-label
  getIntegrations,
  updateIntegration,
  toggleIntegration,
  
  // Policies & Content
  getPolicies,
  updatePolicies,
  getFAQs,
  updateFAQs,
  addFAQ,
  updateFAQ,
  removeFAQ,
  
  // Bulk Operations
  exportSettings,
  
  // File Uploads
  uploadLogo,
  uploadMenuImage,
  generateMenuImage,
  
  // General Update
  updateRestaurant,
} from "./restaurant.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";

const app = express.Router();

// ===========================================
// PUBLIC ROUTES (No authentication needed)
// ===========================================
app.get("/", getRestaurant); // Get restaurant (public view if no auth)
app.get("/config/:subdomain", getRestaurant); // Get by subdomain

// ===========================================
// PROTECTED ROUTES (Admin only)
// ===========================================
app.use(authMiddleware);
app.use(roleMiddleware("admin"));

// ======================
// 1. GENERAL RESTAURANT
// ======================
app.put("/", updateRestaurant); // General restaurant update

// ======================
// 2. SYSTEM WHITE-LABEL
// ======================
app.get("/system-settings", getSystemSettings); // Get all system settings
app.put("/system-settings", updateSystemSettings); // Update all system settings
app.put("/system-settings/:category", updateSystemCategory); // Update specific category

// ======================
// 3. SERVICE WHITE-LABEL
// ======================
app.get("/services", getServices); // Get all service settings
app.put("/services", updateServices); // Update all services
app.put("/services/:service/toggle", toggleService); // Toggle specific service

// ======================
// 4. PAYMENT WHITE-LABEL
// ======================
app.get("/payment-methods", getPaymentMethods); // Get all payment methods
app.post("/payment-methods", addPaymentMethod); // Add new payment method
app.put("/payment-methods/:methodId", updatePaymentMethod); // Update payment method
app.delete("/payment-methods/:methodId", removePaymentMethod); // Remove payment method
app.put("/payment-methods/:methodId/toggle", togglePaymentMethod); // Toggle payment method

// ======================
// 5. WEBSITE WHITE-LABEL
// ======================
app.get("/website-design", getWebsiteDesign); // Get all website design settings
app.put("/website-design", updateWebsiteDesign); // Update entire website design
app.put("/website-design/colors", updateWebsiteColors); // Update colors only

// Add more website design routes as needed:
// app.put("/website-design/fonts", updateWebsiteFonts);
// app.put("/website-design/layout", updateWebsiteLayout);
// app.put("/website-design/seo", updateSEOSettings);
// app.put("/website-design/social-media", updateSocialMedia);
// app.put("/website-design/custom-code", updateCustomCode);

// ======================
// 6. INTEGRATION WHITE-LABEL
// ======================
app.get("/integrations", getIntegrations); // Get all integrations
app.put("/integrations/:integration", updateIntegration); // Update specific integration
app.put("/integrations/:integration/toggle", toggleIntegration); // Toggle integration

// ======================
// 7. POLICIES & CONTENT
// ======================
app.get("/policies", getPolicies); // Get policies (missing in your original)
app.put("/policies", updatePolicies); // Update policies

app.get("/faqs", getFAQs); // Get FAQs (missing in your original)
app.put("/faqs", updateFAQs); // Replace all FAQs
app.post("/faqs", addFAQ); // Add new FAQ
app.put("/faqs/:faqId", updateFAQ); // Update specific FAQ
app.delete("/faqs/:faqId", removeFAQ); // Remove FAQ

// ======================
// 8. BULK OPERATIONS
// ======================
app.get("/export-settings", exportSettings); // Export all settings as JSON
// app.post("/import-settings", importSettings); // Add this later if needed
// app.post("/reset-defaults", resetToDefaults); // Add this later if needed

// ======================
// 9. FILE UPLOADS & ASSETS
// ======================
app.post("/upload-logo", uploadCloud.single("logo"), uploadLogo);
app.post("/upload-menu-image", uploadCloud.single("menuImage"), uploadMenuImage);
// Add favicon upload if you create the controller:
// app.post("/upload-favicon", uploadCloud.single("favicon"), uploadFavicon);
app.post("/generate-menu-image", generateMenuImage);

export default app;