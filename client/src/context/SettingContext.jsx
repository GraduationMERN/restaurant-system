import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const settingsContext = createContext();

export function SettingsProvider({ children }) {
    const { i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    
    const [settings, setSettings] = useState({
        branding: { primaryColor: "", secondaryColor: "", logoUrl: "" },
        restaurantName: "",
        restaurantNameAr: "",
        description: "",
        descriptionAr: "",
        phone: "",
        address: "",
        addressAr: "",
        notifications: { newOrder: true, review: true, dailySales: true, lowStock: false },
        about: { title: "", titleAr: "", content: "", contentAr: "" },
        support: { email: "", phone: "" },
        faqs: [],
        policies: { terms: "", termsAr: "", privacy: "", privacyAr: "" },
    });
    
    useEffect(() => {
      // Apply whenever settings.branding changes
      if (settings.branding) {
        document.documentElement.style.setProperty("--color-primary", settings.branding.primaryColor || "#FF5733");
        document.documentElement.style.setProperty("--color-secondary", settings.branding.secondaryColor || "#33C3FF");
      }
    }, [settings.branding]);
    
    // Fetch settings from backend on mount
    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await api.get("/api/restaurant");
                setSettings(res.data);
            } catch (err) {
                console.error("Failed to load restaurant settings", err);
            }
        }
        fetchSettings();
    }, []);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
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
        <settingsContext.Provider value={{ settings: localizedSettings, rawSettings: settings, updateSettings }}>
            {children}
        </settingsContext.Provider>
    );
}

export const useSettings = () => useContext(settingsContext);
