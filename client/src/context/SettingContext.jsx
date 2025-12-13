import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const settingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        branding: { primaryColor: "", secondaryColor: "", logoUrl: "" },
        restaurantName: "",
        description: "",
        phone: "",
        address: "",
        notifications: { newOrder: true, review: true, dailySales: true, lowStock: false },
        about: { title: "", content: "" },
        support: { email: "", phone: "" },
        faqs: [],
        policies: { terms: "", privacy: "" },
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
                const res = await api.get("/restaurant");
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

    return (
        <settingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </settingsContext.Provider>
    );
}

export const useSettings = () => useContext(settingsContext);
