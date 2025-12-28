// context/SettingContext.js (updated)
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const settingsContext = createContext();

export function SettingsProvider({ children }) {
    const { i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    
    const [settings, setSettings] = useState({
        // Basic Info
        restaurantName: "",
        restaurantNameAr: "",
        description: "",
        descriptionAr: "",
        phone: "",
        address: "",
        addressAr: "",
        
        // White-label Categories
        systemSettings: {
            general: { currency: "USD", timezone: "America/New_York", language: "en", dateFormat: "MM/DD/YYYY", timeFormat: "12h" },
            location: { latitude: 0, longitude: 0, deliveryRadius: 5 },
            conditionalFees: { enabled: false, rules: [] },
            policies: { requireTerms: true, requirePrivacy: true },
            functionality: { customerAccounts: true, ageVerification: false, tipping: true, webhooks: false },
            receiptPrinting: { enabled: true, header: "Thank You!", footer: "Visit Again!" },
            emailNotifications: { enabled: true, orderConfirmation: true, orderReady: true },
            audioNotifications: { enabled: true, sound: "default" },
            ordering: { prepTime: 20, minOrderAmount: 0, advanceOrdering: true },
            misc: { autoLogout: 30, maintenanceMode: false },
        },
        
        services: {
            pickups: { enabled: true, prepTime: 15 },
            deliveries: { enabled: true, fee: 0, minOrder: 0 },
            dineIns: { enabled: true, tableManagement: false },
            tableBookings: { enabled: false, advanceBooking: true },
        },
        
        paymentMethods: [
            { name: "Cash", type: "cash", enabled: true, processingFee: 0 },
            { name: "Credit/Debit Card", type: "card", enabled: true, processingFee: 0 },
        ],
        
        websiteDesign: {
            colors: { primary: "#2563eb", secondary: "#e27e36", background: "#ffffff", text: "#333333" },
            fonts: { primary: "Inter, sans-serif", secondary: "Roboto, sans-serif" },
            layout: { headerType: "standard", menuStyle: "grid", footerEnabled: true },
            domain: { customDomain: "", subdomain: "" },
            seo: { title: "", description: "", keywords: "" },
            customCode: { css: "", javascript: "" },
            socialMedia: { facebook: "", instagram: "", twitter: "" },
        },
        
        integrations: {
            facebookPixel: { enabled: false, pixelId: "" },
            googleAnalytics: { enabled: false, trackingId: "" },
        },
        
        branding: { 
            primaryColor: "#2563eb", 
            secondaryColor: "#e27e36", 
            logoUrl: "", 
            menuImage: "", 
            faviconUrl: "" 
        },
        
        notifications: { newOrder: true, review: true, dailySales: true, lowStock: false },
        about: { title: "", titleAr: "", content: "", contentAr: "" },
        support: { email: "", phone: "" },
        faqs: [],
        policies: { terms: "", termsAr: "", privacy: "", privacyAr: "" },
        
        // System fields
        isActive: true,
        status: "pending",
        subscriptionPlan: "free",
    });
    
    // Apply branding CSS variables
    useEffect(() => {
      if (settings.branding) {
        document.documentElement.style.setProperty("--color-primary", settings.branding.primaryColor || "#2563eb");
        document.documentElement.style.setProperty("--color-secondary", settings.branding.secondaryColor || "#e27e36");
        
        // Apply website design colors too
        if (settings.websiteDesign?.colors) {
          document.documentElement.style.setProperty("--website-primary", settings.websiteDesign.colors.primary);
          document.documentElement.style.setProperty("--website-secondary", settings.websiteDesign.colors.secondary);
          document.documentElement.style.setProperty("--website-background", settings.websiteDesign.colors.background);
          document.documentElement.style.setProperty("--website-text", settings.websiteDesign.colors.text);
        }
      }
    }, [settings.branding, settings.websiteDesign?.colors]);
    
    // Fetch settings from backend
    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await api.get("/api/restaurant");
                const data = res.data.data || res.data;
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    // Ensure nested objects exist
                    systemSettings: { ...prev.systemSettings, ...(data.systemSettings || {}) },
                    services: { ...prev.services, ...(data.services || {}) },
                    websiteDesign: { ...prev.websiteDesign, ...(data.websiteDesign || {}) },
                    integrations: { ...prev.integrations, ...(data.integrations || {}) },
                    paymentMethods: data.paymentMethods || prev.paymentMethods,
                }));
            } catch (err) {
                console.error("Failed to load restaurant settings", err);
            }
        }
        fetchSettings();
    }, []);

    // Update specific setting
    const updateSetting = (path, value) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            const keys = path.split('.');
            let current = newSettings;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };

    // Update multiple settings at once
    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Save settings to backend
    const saveSettings = async (settingsToSave = null) => {
        try {
            const dataToSave = settingsToSave || settings;
            await api.put("/api/restaurant", dataToSave);
            return true;
        } catch (err) {
            console.error("Failed to save settings", err);
            return false;
        }
    };

    // Update specific category
    const updateCategory = async (category, data) => {
        try {
            await api.put(`/api/restaurant/${category}`, data);
            updateSettings({ [category]: data });
            return true;
        } catch (err) {
            console.error(`Failed to update ${category}`, err);
            return false;
        }
    };
    
    // Create localized settings based on current language
    const localizedSettings = useMemo(() => {
        return {
            ...settings,
            // Use Arabic values if available and language is Arabic
            restaurantName: isArabic && settings.restaurantNameAr ? settings.restaurantNameAr : settings.restaurantName,
            description: isArabic && settings.descriptionAr ? settings.descriptionAr : settings.description,
            address: isArabic && settings.addressAr ? settings.addressAr : settings.address,
            about: {
                ...settings.about,
                title: isArabic && settings.about?.titleAr ? settings.about.titleAr : settings.about?.title,
                content: isArabic && settings.about?.contentAr ? settings.about.contentAr : settings.about?.content,
            },
            faqs: settings.faqs?.map(faq => ({
                ...faq,
                question: isArabic && faq.questionAr ? faq.questionAr : faq.question,
                answer: isArabic && faq.answerAr ? faq.answerAr : faq.answer,
            })) || [],
            policies: {
                ...settings.policies,
                terms: isArabic && settings.policies?.termsAr ? settings.policies.termsAr : settings.policies?.terms,
                privacy: isArabic && settings.policies?.privacyAr ? settings.policies.privacyAr : settings.policies?.privacy,
            },
        };
    }, [settings, isArabic]);

    return (
        <settingsContext.Provider value={{ 
            settings: localizedSettings, 
            rawSettings: settings, 
            updateSettings,
            updateSetting,
            saveSettings,
            updateCategory
        }}>
            {children}
        </settingsContext.Provider>
    );
}

export const useSettings = () => useContext(settingsContext);