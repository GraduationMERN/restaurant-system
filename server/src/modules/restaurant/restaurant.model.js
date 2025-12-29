import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    // Basic Info
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },
    restaurantNameAr: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    descriptionAr: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    addressAr: {
      type: String,
      default: "",
    },

    // ======================
    // 1. SYSTEM WHITE-LABEL
    // ======================
    systemSettings: {
      // General
      general: {
        currency: { type: String, default: "USD" },
        timezone: { type: String, default: "America/New_York" },
        language: { type: String, default: "en" },
        dateFormat: { type: String, default: "MM/DD/YYYY" },
        timeFormat: { type: String, default: "12h" },
      },

      // Location
      location: {
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
        deliveryRadius: { type: Number, default: 5 }, // km
      },

      // Conditional Fees (can be extended later)
      conditionalFees: {
        enabled: { type: Boolean, default: false },
        rules: [{
          name: String,
          condition: String, // "orderAmount", "distance", "time"
          value: Number,
          fee: Number,
          _id: false
        }],
        default: []
      },

      // Policies & Agreements (simple version)
      policies: {
        requireTerms: { type: Boolean, default: true },
        requirePrivacy: { type: Boolean, default: true },
      },

      // Functionality (core features)
      functionality: {
        customerAccounts: { type: Boolean, default: true },
        ageVerification: { type: Boolean, default: false },
        tipping: { type: Boolean, default: true },
        webhooks: { type: Boolean, default: false },
      },

      // Receipt Printing
      receiptPrinting: {
        enabled: { type: Boolean, default: true },
        header: { type: String, default: "Thank You!" },
        footer: { type: String, default: "Visit Again!" },
      },

      // Notifications
      emailNotifications: {
        enabled: { type: Boolean, default: true },
        orderConfirmation: { type: Boolean, default: true },
        orderReady: { type: Boolean, default: true },
      },

      audioNotifications: {
        enabled: { type: Boolean, default: true },
        sound: { type: String, default: "default" },
      },

      // Ordering
      ordering: {
        prepTime: { type: Number, default: 20 }, // minutes
        minOrderAmount: { type: Number, default: 0 },
        advanceOrdering: { type: Boolean, default: true },
      },

      // Misc
      misc: {
        autoLogout: { type: Number, default: 30 }, // minutes
        maintenanceMode: { type: Boolean, default: false },
      },
    },

    // ======================
    // 2. SERVICE WHITE-LABEL
    // ======================
    services: {
      pickups: {
        enabled: { type: Boolean, default: true },
        prepTime: { type: Number, default: 15 },
      },
      deliveries: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 0 },
        minOrder: { type: Number, default: 0 },
      },
      dineIns: {
        enabled: { type: Boolean, default: true },
        tableManagement: { type: Boolean, default: false },
      },
      tableBookings: {
        enabled: { type: Boolean, default: false },
        advanceBooking: { type: Boolean, default: true },
      },
    },

    // ======================
    // 3. PAYMENT WHITE-LABEL
    // ======================
    paymentMethods: [
      {
        name: { type: String, required: true }, // "Cash", "Card", etc.
        type: {
          type: String,
          enum: ["cash", "card", "online", "wallet"],
          required: true,
        },
        enabled: { type: Boolean, default: true },
        credentials: { type: mongoose.Schema.Types.Mixed, default: {} }, // For API keys, etc.
        processingFee: { type: Number, default: 0 },
      },
    ],

    // Default payment methods (array of types)
    defaultPaymentMethods: {
      type: [String],
      default: ["cash", "card"],
    },

    // ======================
    // 4. WEBSITE WHITE-LABEL (Design)
    // ======================
    websiteDesign: {
      // Colors
      colors: {
        primary: { type: String, default: "#2563eb" },
        secondary: { type: String, default: "#e27e36" },
        background: { type: String, default: "#ffffff" },
        text: { type: String, default: "#333333" },
      },

      // Fonts
      fonts: {
        primary: { type: String, default: "Inter, sans-serif" },
        secondary: { type: String, default: "Roboto, sans-serif" },
      },

      // Layout
      layout: {
        headerType: { type: String, default: "standard" },
        menuStyle: { type: String, default: "grid" },
        footerEnabled: { type: Boolean, default: true },
      },

      // Domain & SEO
      domain: {
        customDomain: { type: String, default: "" },
        subdomain: { type: String, unique: true, sparse: true },
      },

      seo: {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        keywords: { type: String, default: "" },
      },

      // Custom code
      customCode: {
        css: { type: String, default: "" },
        javascript: { type: String, default: "" },
      },

      // Social Media
      socialMedia: {
        facebook: { type: String, default: "" },
        instagram: { type: String, default: "" },
        twitter: { type: String, default: "" },
      },
    },

    // ======================
    // 5. INTEGRATION WHITE-LABEL
    // ======================
    integrations: {
      facebookPixel: {
        enabled: { type: Boolean, default: false },
        pixelId: { type: String, default: "" },
      },
      googleAnalytics: {
        enabled: { type: Boolean, default: false },
        trackingId: { type: String, default: "" },
      },
      // We can add Tookan, Shipday later
    },

    // ======================
    // EXISTING FIELDS (keeping your structure)
    // ======================
    branding: {
      primaryColor: {
        type: String,
        default: "#2563eb",
      },
      secondaryColor: {
        type: String,
        default: "#e27e36",
      },
      logoUrl: {
        type: String,
        default: "",
      },
      menuImage: {
        type: String,
        default: "",
      },
      faviconUrl: { type: String, default: "" },
    },

    notifications: {
      newOrder: { type: Boolean, default: true },
      review: { type: Boolean, default: true },
      dailySales: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: false },
    },

    about: {
      title: { type: String, default: "About Us" },
      titleAr: { type: String, default: "من نحن" },
      content: { type: String, default: "" },
      contentAr: { type: String, default: "" },
    },

    support: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    faqs: {
      type: [
        {
          question: { type: String, required: true },
          questionAr: { type: String, default: "" },
          answer: { type: String, required: true },
          answerAr: { type: String, default: "" },
        },
      ],
      default: [
        // Your existing FAQs
      ],
    },

    policies: {
      terms: { type: String, default: "By using our service..." },
      termsAr: { type: String, default: "باستخدامك لخدمتنا..." },
      privacy: { type: String, default: "We respect your privacy..." },
      privacyAr: { type: String, default: "نحن نحترم خصوصيتك..." },
    },

    // System fields
    isActive: { type: Boolean, default: true },
    status: { 
      type: String, 
      enum: ["active", "suspended", "pending"], 
      default: "pending" 
    },
    subscriptionPlan: { 
      type: String, 
      enum: ["free", "basic", "premium", "enterprise"], 
      default: "free" 
    },
  },
  { timestamps: true }
);

// Indexes for performance
restaurantSchema.index({ "websiteDesign.domain.subdomain": 1 });
restaurantSchema.index({ status: 1 });
restaurantSchema.index({ subscriptionPlan: 1 });

// Pre-save middleware to set defaults
restaurantSchema.pre('save', function(next) {
  // Set default payment methods if empty
  if (this.paymentMethods.length === 0) {
    this.paymentMethods = [
      { name: "Cash", type: "cash", enabled: true },
      { name: "Credit/Debit Card", type: "card", enabled: true }
    ];
  }

  // Ensure subdomain is set from websiteDesign if not already
  if (!this.websiteDesign?.domain?.subdomain && this.restaurantName) {
    const subdomain = this.restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    if (!this.websiteDesign) this.websiteDesign = {};
    if (!this.websiteDesign.domain) this.websiteDesign.domain = {};
    this.websiteDesign.domain.subdomain = subdomain;
  }

  next();
});

// Method to get public config (for customer-facing website)
restaurantSchema.methods.getPublicConfig = function() {
  return {
    // Basic info
    restaurantName: this.restaurantName,
    restaurantNameAr: this.restaurantNameAr,
    description: this.description,
    descriptionAr: this.descriptionAr,
    phone: this.phone,
    address: this.address,
    addressAr: this.addressAr,
    
    // Branding
    branding: this.branding,
    
    // Services enabled
    services: this.services,
    
    // Payment methods (only enabled ones)
    paymentMethods: this.paymentMethods.filter(pm => pm.enabled),
    
    // Website design
    websiteDesign: this.websiteDesign,
    
    // Policies & FAQs
    about: this.about,
    support: this.support,
    faqs: this.faqs,
    policies: this.policies,
    
    // System settings that affect frontend
    systemSettings: {
      general: this.systemSettings.general,
      ordering: this.systemSettings.ordering,
      functionality: this.systemSettings.functionality,
    },
  };
};

// Method to get admin config (full details)
restaurantSchema.methods.getAdminConfig = function() {
  const obj = this.toObject();
  return obj;
};

export default mongoose.model("Restaurant", restaurantSchema);