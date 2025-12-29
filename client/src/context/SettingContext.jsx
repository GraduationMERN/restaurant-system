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
        systemSettings: {},
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Apply CSS variables whenever branding changes
    useEffect(() => {
        if (settings.branding) {
            document.documentElement.style.setProperty("--color-primary", settings.branding.primaryColor || "#FF5733");
            document.documentElement.style.setProperty("--color-secondary", settings.branding.secondaryColor || "#33C3FF");
        }
    }, [settings.branding]);

    // Fetch settings from backend on mount
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
                    branding: (payload && (payload.branding || payload.systemSettings?.branding)) || { primaryColor: "", secondaryColor: "", logoUrl: "" },
                    systemSettings: payload?.systemSettings || {},
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

    // Update local state only (for form drafts)
    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Save general restaurant settings to backend (root level fields)
    const saveGeneralSettings = async (generalSettings) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.put('/api/restaurant', generalSettings);
            const returned = res.data?.data ?? res.data;
            
            // Update local state with saved data
            setSettings(prev => ({
                ...prev,
                ...returned,
                branding: returned.branding || prev.branding,
                systemSettings: returned.systemSettings || prev.systemSettings,
            }));
            
            return returned;
        } catch (err) {
            console.error('Failed to save general settings:', err);
            setError(err?.response?.data?.message || err.message || 'Failed to save settings');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Persist a specific system category to backend and update local state
    const saveSystemCategory = async (category, categoryPayload) => {
        setLoading(true);
        setError(null);
        try {
            const body = categoryPayload;
            const res = await api.put(`/api/restaurant/system-settings/${category}`, body);
            const returned = res.data?.data ?? null;

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
            throw err;
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
            const returned = res.data?.data ?? null;
            if (returned) {
                setSettings((prev) => ({
                    ...prev,
                    systemSettings: returned,
                    branding: returned.branding ?? prev.branding,
                }));
            }
            return returned;
        } catch (err) {
            console.error('Failed to save system settings:', err);
            setError(err?.response?.data?.message || err.message || 'Failed to save settings');
            throw err;
        } finally {
            setLoading(false);
        }
    };
    
    // Create localized settings based on current language
    const localizedSettings = useMemo(() => {
        return {
            ...settings,
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
            saveGeneralSettings,
            saveSystemCategory,
            saveSystemSettings,
            loading,
            error,
        }}>
            {children}
        </settingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(settingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};