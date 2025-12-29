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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            try {
                const res = await api.get("/api/restaurant");
                // API returns { success, data }
                const payload = res.data?.data ?? res.data;
                // Normalize branding location: backend may store branding at root or under systemSettings.branding
                const normalized = {
                    ...(payload || {}),
                    branding: (payload && (payload.branding || payload.systemSettings?.branding)) || undefined,
                };
                setSettings(normalized);
            } catch (err) {
                console.error("Failed to load restaurant settings", err);
                setError(err?.response?.data?.message || err.message || "Failed to load settings");
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    // Update local state only
    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Persist a specific system category to backend and update local state
    const saveSystemCategory = async (category, categoryPayload) => {
        setLoading(true);
        setError(null);
        try {
            const body = categoryPayload;
            const res = await api.put(`/api/restaurant/system-settings/${category}`, body);
            const returned = res.data?.data ?? null; // controller returns updated category data

            // Merge returned category into local settings.systemSettings
            setSettings((prev) => {
                const newSystem = {
                    ...(prev.systemSettings || {}),
                    [category]: returned ?? (categoryPayload[category] ?? categoryPayload),
                };
                const newRoot = {
                    ...prev,
                    systemSettings: newSystem,
                };
                // If category is branding, also mirror to top-level `branding` for compatibility
                if (category === 'branding') {
                    newRoot.branding = returned ?? (categoryPayload[category] ?? categoryPayload);
                }
                return newRoot;
            });

            return returned;
        } catch (err) {
            console.error(`Failed to save system category ${category}:`, err);
            setError(err?.response?.data?.message || err.message || "Failed to save settings");
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Persist full system settings
    const saveSystemSettings = async (systemSettingsPayload) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.put('/api/restaurant/system-settings', { systemSettings: systemSettingsPayload });
            const returned = res.data?.data ?? null; // updated.systemSettings
            if (returned) {
                setSettings((prev) => ({
                    ...prev,
                    systemSettings: returned,
                    // Mirror branding if present
                    branding: returned.branding ?? prev.branding,
                }));
            }
            return returned;
        } catch (err) {
            console.error('Failed to save system settings:', err);
            setError(err?.response?.data?.message || err.message || 'Failed to save settings');
            return null;
        } finally {
            setLoading(false);
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
            saveSystemCategory,
            saveSystemSettings,
            loading,
            error,
        }}>
            {children}
        </settingsContext.Provider>
    );
}

export const useSettings = () => useContext(settingsContext);
