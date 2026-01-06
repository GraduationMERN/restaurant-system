// restaurant.route.js - UPDATED VERSION
import express from "express";
import {
  // Public routes
  getRestaurant,
  
  // System White-label
  getSystemSettings,
  updateSystemSettings,
  updateSystemCategory,
  
  // Landing Page Specific - ADD THESE IMPORTS
  getLandingSettings,
  updateLandingSettings,
  resetLandingPage,
  uploadLandingImage,
  
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
  importSettings,
  
  // File Uploads
  uploadLogo,
  uploadMenuImage,
  uploadFavicon,
  generateMenuImage,
  // Instagram import
  importInstagramPosts,
  
  // General Update
  updateRestaurant,
} from "./restaurant.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";

// In test environment we allow injecting a simple test upload middleware
const uploadLogoMiddleware = process.env.NODE_ENV === 'test'
  ? (req, res, next) => { if (req.headers['x-test-file-url']) req.file = { path: req.headers['x-test-file-url'] }; next(); }
  : uploadCloud.single('logo');

const uploadMenuMiddleware = process.env.NODE_ENV === 'test'
  ? (req, res, next) => { if (req.headers['x-test-file-url']) req.file = { path: req.headers['x-test-file-url'] }; next(); }
  : uploadCloud.single('menuImage');

const uploadFaviconMiddleware = process.env.NODE_ENV === 'test'
  ? (req, res, next) => { if (req.headers['x-test-file-url']) req.file = { path: req.headers['x-test-file-url'] }; next(); }
  : uploadCloud.single('favicon');

const uploadLandingMiddleware = process.env.NODE_ENV === 'test'
  ? (req, res, next) => { if (req.headers['x-test-file-url']) req.file = { path: req.headers['x-test-file-url'] }; next(); }
  : uploadCloud.single('image');

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
// 3. LANDING PAGE SETTINGS - ADD THESE ROUTES
// ======================
app.get("/landing-settings", getLandingSettings); // Get landing page settings
app.put("/landing-settings", updateLandingSettings); // Update landing page settings
app.post("/landing-settings/reset", resetLandingPage); // Reset landing page to defaults
app.post("/upload-landing-image", uploadCloud.single("image"), uploadLandingImage); // Upload landing image
// Import Instagram (admin)
app.post('/landing-settings/import-instagram', importInstagramPosts);

// ======================
// 4. SERVICE WHITE-LABEL
// ======================
app.get("/services", getServices); // Get all service settings
app.put("/services", updateServices); // Update all services
app.put("/services/:service/toggle", toggleService); // Toggle specific service

// ======================
// 5. PAYMENT WHITE-LABEL
// ======================
app.get("/payment-methods", getPaymentMethods); // Get all payment methods
app.post("/payment-methods", addPaymentMethod); // Add new payment method
app.put("/payment-methods/:methodId", updatePaymentMethod); // Update payment method
app.delete("/payment-methods/:methodId", removePaymentMethod); // Remove payment method
app.put("/payment-methods/:methodId/toggle", togglePaymentMethod); // Toggle payment method

// ======================
// 6. WEBSITE WHITE-LABEL
// ======================
app.get("/website-design", getWebsiteDesign); // Get all website design settings
app.put("/website-design", updateWebsiteDesign); // Update entire website design
app.put("/website-design/colors", updateWebsiteColors); // Update colors only

// ======================
// 7. INTEGRATION WHITE-LABEL
// ======================
app.get("/integrations", getIntegrations); // Get all integrations
app.put("/integrations/:integration", updateIntegration); // Update specific integration
app.put("/integrations/:integration/toggle", toggleIntegration); // Toggle integration

// ======================
// 8. POLICIES & CONTENT
// ======================
app.get("/policies", getPolicies); // Get policies
app.put("/policies", updatePolicies); // Update policies

app.get("/faqs", getFAQs); // Get FAQs
app.put("/faqs", updateFAQs); // Replace all FAQs
app.post("/faqs", addFAQ); // Add new FAQ
app.put("/faqs/:faqId", updateFAQ); // Update specific FAQ
app.delete("/faqs/:faqId", removeFAQ); // Remove FAQ

// ======================
// 9. BULK OPERATIONS
// ======================
app.get("/export-settings", exportSettings); // Export all settings as JSON
app.post("/import-settings", importSettings); // Import settings (merge/overwrite)

// ======================
// 10. FILE UPLOADS & ASSETS
// ======================
app.post("/upload-logo", uploadLogoMiddleware, uploadLogo);
app.post("/upload-menu-image", uploadMenuMiddleware, uploadMenuImage);
app.post("/upload-favicon", uploadFaviconMiddleware, uploadFavicon);
app.post("/generate-menu-image", generateMenuImage);
app.post("/upload-landing-image", uploadLandingMiddleware, uploadLandingImage);

export default app;