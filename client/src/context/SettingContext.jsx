import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const settingsContext = createContext();

// Helpers
const DEFAULT_LANDING = {
    hero: { title: "", titleAr: "", subtitle: "", subtitleAr: "", image: "", enabled: true },
    about: { title: "", titleAr: "", content: "", contentAr: "", image: "", enabled: true },
    testimonials: { items: [], featuredIds: [], mode: 'all', enabled: true },
    services: { enabled: true, items: [] },
    contact: { email: "", phone: "", enabled: true },
    callUs: { number: "", numberAr: "", label: "Call Us", labelAr: "اتصل بنا", enabled: true },
    location: { address: "", addressAr: "", latitude: "", longitude: "", enabled: true },
    hours: {
        monday: { open: "11:00", close: "22:00", enabled: true },
        tuesday: { open: "11:00", close: "22:00", enabled: true },
        wednesday: { open: "11:00", close: "22:00", enabled: true },
        thursday: { open: "11:00", close: "22:00", enabled: true },
        friday: { open: "11:00", close: "23:00", enabled: true },
        saturday: { open: "10:00", close: "23:00", enabled: true },
        sunday: { open: "10:00", close: "22:00", enabled: true }
    },
    footer: { text: "", enabled: true },
    seo: { title: "", description: "", enabled: true },
    instagram: { enabled: false, posts: [] },
    specialOffer: { enabled: true }
};

const OFFLINE_QUEUE_KEY = 'settings_offline_queue_v1';

function saveQueueToStorage(queue) {
    try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue)); } catch (_) {}
}

function loadQueueFromStorage() {
    try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch (_) { return []; }
}

export function SettingsProvider({ children }) {
    const { i18n } = useTranslation();
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
        systemSettings: { landing: DEFAULT_LANDING },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [cacheTimestamp, setCacheTimestamp] = useState(Date.now());
    const queueRef = useRef(loadQueueFromStorage());
    const undoStackRef = useRef([]);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | queued | error
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const retryAttemptsRef = useRef({});

    // Apply CSS variables whenever branding changes
    useEffect(() => {
        if (settings.branding) {
            document.documentElement.style.setProperty("--color-primary", settings.branding.primaryColor || "#FF5733");
            document.documentElement.style.setProperty("--color-secondary", settings.branding.secondaryColor || "#33C3FF");
        }
    }, [settings.branding]);

    // i18n language change listener for automatic switching
    useEffect(() => {
        const handleLang = (lng) => setTimeout(() => setCacheTimestamp(Date.now()), 0);
        i18n.on('languageChanged', handleLang);
        return () => i18n.off('languageChanged', handleLang);
    }, [i18n]);

    // Online/offline handlers and queue flushing
    useEffect(() => {
        const onOnline = () => { setIsOnline(true); flushQueue(); };
        const onOffline = () => { setIsOnline(false); };
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
    }, []);

    // Simple exponential backoff retry helper
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    async function fetchWithRetry(config, { retries = 3, backoff = 300 } = {}) {
        // config: { method, url, data, headers }
        if (!isOnline) {
            // queue and persist
            const id = Date.now() + Math.random();
            queueRef.current.push({ id, config });
            saveQueueToStorage(queueRef.current);
            return { queued: true, id };
        }

        const key = `${config.method || 'get'}:${config.url}`;
        retryAttemptsRef.current[key] = retryAttemptsRef.current[key] || 0;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const res = await api.request(config);
                retryAttemptsRef.current[key] = 0;
                return res;
            } catch (err) {
                const status = err?.response?.status;
                // Do not retry on 4xx (client) errors except 429
                if (status && status >= 400 && status < 500 && status !== 429) throw err;
                retryAttemptsRef.current[key] = (retryAttemptsRef.current[key] || 0) + 1;
                if (attempt < retries) await delay(backoff * Math.pow(2, attempt));
                else throw err;
            }
        }
    }

    async function flushQueue() {
        if (!queueRef.current.length || !isOnline) return;
        const queue = [...queueRef.current];
        queueRef.current = [];
        saveQueueToStorage([]);
        for (const item of queue) {
            try {
                await api.request(item.config);
            } catch (err) {
                // If still failing, push back to queue with exponential backoff later
                queueRef.current.push(item);
                saveQueueToStorage(queueRef.current);
                return; // stop processing to avoid tight loop
            }
        }
    }

    // Normalize server payload and ensure defaults
    const normalizePayload = (payload = {}) => {
        return {
            ...payload,
            branding: payload.branding || { primaryColor: "#2563eb", secondaryColor: "#e27e36", logoUrl: "" },
            systemSettings: {
                ...(payload.systemSettings || {}),
                landing: payload?.systemSettings?.landing ? { ...DEFAULT_LANDING, ...payload.systemSettings.landing } : { ...DEFAULT_LANDING }
            },
            faqs: payload.faqs || [],
            policies: payload.policies || { terms: '', termsAr: '', privacy: '', privacyAr: '' }
        };
    };

    // Fetch settings
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant' }, { retries: 2 });
            const payload = res?.data?.data ?? res?.data ?? {};
            const normalized = normalizePayload(payload);
            setSettings(normalized);
            setError(null);
            setCacheTimestamp(Date.now());
            return normalized;
        } catch (err) {
            console.error('[SettingsContext] Failed to load restaurant settings', err);
            setError(err?.response?.data?.message || err.message || 'Failed to load settings');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, [refreshCounter]);

    const refreshSettings = () => setRefreshCounter(prev => prev + 1);

    // Local update for form drafts
    const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }));

    // Generic save functions
    const saveGeneralSettings = async (generalSettings, { optimistic = true } = {}) => {
        setError(null);
        const prev = settings;
        // push undo entry
        if (optimistic) {
            undoStackRef.current.push({ kind: 'general', prev: JSON.parse(JSON.stringify(prev)), ts: Date.now() });
        }
        setSyncStatus('syncing');
        if (optimistic) setSettings(prev => ({ ...prev, ...generalSettings }));
        try {
            const res = await fetchWithRetry({ method: 'put', url: '/api/restaurant', data: generalSettings }, { retries: 2 });
            const returned = res?.data?.data ?? res?.data ?? null;
            if (returned) setSettings(normalizePayload(returned));
            setCacheTimestamp(Date.now());
            setTimeout(() => refreshSettings(), 200);
            setSyncStatus('idle');
            setLastSyncedAt(Date.now());
            return returned;
        } catch (err) {
            console.error('[SettingsContext] saveGeneralSettings failed', err);
            setError(err?.response?.data?.message || err.message || 'Save failed');
            if (optimistic) setSettings(prev);
            setSyncStatus('error');
            throw err;
        }
    };

    // System settings
    const getSystemSettings = () => settings.systemSettings;

    const saveSystemCategory = async (category, categoryPayload, { optimistic = true } = {}) => {
        setError(null);
        const prev = settings;
        if (optimistic) {
            // store previous category data for undo
            const prevCategory = prev.systemSettings?.[category] ? JSON.parse(JSON.stringify(prev.systemSettings[category])) : null;
            undoStackRef.current.push({ kind: 'systemCategory', category, prevCategory, ts: Date.now() });
            setSettings(s => ({ ...s, systemSettings: { ...s.systemSettings, [category]: categoryPayload } }));
        }
        setSyncStatus('syncing');
        try {
            const res = await fetchWithRetry({ method: 'put', url: `/api/restaurant/system-settings/${category}`, data: categoryPayload }, { retries: 2 });
            const categoryData = res?.data?.data ?? categoryPayload;
            setSettings(s => ({ ...s, systemSettings: { ...(s.systemSettings || {}), [category]: categoryData } }));
            setCacheTimestamp(Date.now());
            setTimeout(() => refreshSettings(), 300);
            setSyncStatus('idle');
            setLastSyncedAt(Date.now());
            return categoryData;
        } catch (err) {
            console.error(`[SettingsContext] saveSystemCategory ${category} failed`, err);
            setError(err?.response?.data?.message || err.message || 'Save failed');
            if (optimistic) setSettings(prev);
            setSyncStatus('error');
            throw err;
        }
    };

    const saveSystemSettings = async (systemSettingsPayload, { optimistic = true } = {}) => {
        setError(null);
        const prev = settings;
        if (optimistic) {
            undoStackRef.current.push({ kind: 'systemSettings', prevSystemSettings: JSON.parse(JSON.stringify(prev.systemSettings || {})), ts: Date.now() });
            setSettings(s => ({ ...s, systemSettings: systemSettingsPayload }));
        }
        setSyncStatus('syncing');
        try {
            const res = await fetchWithRetry({ method: 'put', url: '/api/restaurant/system-settings', data: { systemSettings: systemSettingsPayload } }, { retries: 2 });
            const returned = res?.data?.data ?? systemSettingsPayload;
            setSettings(s => ({ ...s, systemSettings: returned }));
            setCacheTimestamp(Date.now());
            setTimeout(() => refreshSettings(), 200);
            setSyncStatus('idle');
            setLastSyncedAt(Date.now());
            return returned;
        } catch (err) {
            console.error('[SettingsContext] saveSystemSettings failed', err);
            setError(err?.response?.data?.message || err.message || 'Save failed');
            if (optimistic) setSettings(prev);
            setSyncStatus('error');
            throw err;
        }
    };

    // Landing specific
    const getLandingSettings = () => settings.systemSettings?.landing || DEFAULT_LANDING;
    const updateLandingSettings = async (payload, opts) => saveSystemCategory('landing', payload, opts);
    const importInstagramPosts = async ({ username, count = 8, persist = false } = {}) => {
        const url = `/api/restaurant/landing-settings/import-instagram${persist ? '' : '?persist=false'}`;
        const res = await fetchWithRetry({ method: 'post', url, data: { username, count } }, { retries: 1 });
        const returned = res?.data?.data ?? res?.data ?? null;
        // If persisted response includes landing with instagram posts, merge into settings
        if (persist && returned && returned.instagram && Array.isArray(returned.instagram.posts)) {
            setSettings(s => ({ ...s, systemSettings: { ...(s.systemSettings || {}), landing: { ...(s.systemSettings?.landing || {}), instagram: { ...(s.systemSettings?.landing?.instagram || {}), posts: returned.instagram.posts, enabled: returned.instagram.enabled !== false } } } }));
        }
        // for preview (persist=false) returned contains { instagram: { posts } }
        return returned;
    };
    const resetLandingPage = async () => {
        try {
            const res = await fetchWithRetry({ method: 'post', url: '/api/restaurant/landing-settings/reset' }, { retries: 1 });
            const returned = res?.data?.data ?? DEFAULT_LANDING;
            setSettings(s => ({ ...s, systemSettings: { ...(s.systemSettings || {}), landing: returned } }));
            return returned;
        } catch (err) {
            throw err;
        }
    };

    // Upload helpers
    const uploadFile = async (file, fieldName = 'file', endpoint = '/api/restaurant/upload-logo') => {
        const form = new FormData();
        form.append(fieldName, file);
        const res = await fetchWithRetry({ method: 'post', url: endpoint, data: form, headers: { 'Content-Type': 'multipart/form-data' } }, { retries: 2 });
        return res?.data?.data ?? res?.data ?? null;
    };

    const uploadLogo = async (file, { optimistic = true } = {}) => {
        const prev = settings;
        if (optimistic && file instanceof File) {
            undoStackRef.current.push({ kind: 'general', prev: JSON.parse(JSON.stringify(prev)), ts: Date.now() });
            setSettings(s => ({ ...s, branding: { ...s.branding, logoUrl: URL.createObjectURL(file) } }));
            setSyncStatus('syncing');
        }
        try {
            const data = await uploadFile(file, 'logo', '/api/restaurant/upload-logo');
            // backend returns { url, restaurant }
            if (data?.restaurant) setSettings(normalizePayload(data.restaurant));
            else if (data?.url) setSettings(s => ({ ...s, branding: { ...s.branding, logoUrl: data.url } }));
            setSyncStatus('idle');
            setLastSyncedAt(Date.now());
            return data;
        } catch (err) {
            if (optimistic) setSettings(prev);
            setSyncStatus('error');
            throw err;
        }
    };

    const uploadFavicon = async (file) => uploadFile(file, 'favicon', '/api/restaurant/upload-favicon');
    const uploadMenuImage = async (file) => uploadFile(file, 'menuImage', '/api/restaurant/upload-menu-image');
    const uploadLandingImage = async (file, { target = 'landing.hero.image' } = {}) => {
        // backend expects 'image' file and query target
        const form = new FormData();
        form.append('image', file);
        const url = `/api/restaurant/upload-landing-image?target=${encodeURIComponent(target)}`;
        const res = await fetchWithRetry({ method: 'post', url, data: form, headers: { 'Content-Type': 'multipart/form-data' } }, { retries: 2 });
        const data = res?.data?.data ?? res?.data ?? null;
        // Update local state if returned
        if (data?.restaurant) setSettings(normalizePayload(data.restaurant));
        return data;
    };

    // Services
    const getServices = async () => {
        try { const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant/services' }); return res.data?.data ?? res.data; } catch (err) { throw err; }
    };
    const updateServices = async (payload) => saveSystemCategory('services', payload);
    const toggleService = async (service, enabled) => {
        try {
            const res = await fetchWithRetry({ method: 'put', url: `/api/restaurant/services/${service}/toggle`, data: { enabled } });
            return res.data?.data ?? res.data;
        } catch (err) { throw err; }
    };

    // Payments
    const getPaymentMethods = async () => { const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant/payment-methods' }); return res.data?.data ?? res.data; };
    const addPaymentMethod = async (method) => { const res = await fetchWithRetry({ method: 'post', url: '/api/restaurant/payment-methods', data: method }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const updatePaymentMethod = async (id, updates) => { const res = await fetchWithRetry({ method: 'put', url: `/api/restaurant/payment-methods/${id}`, data: updates }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const removePaymentMethod = async (id) => { const res = await fetchWithRetry({ method: 'delete', url: `/api/restaurant/payment-methods/${id}` }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const togglePaymentMethod = async (id, enabled) => { const res = await fetchWithRetry({ method: 'put', url: `/api/restaurant/payment-methods/${id}/toggle`, data: { enabled } }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };

    // Website design
    const getWebsiteDesign = async () => { const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant/website-design' }); return res.data?.data ?? res.data; };
    const updateWebsiteDesign = async (design) => { const res = await fetchWithRetry({ method: 'put', url: '/api/restaurant/website-design', data: design }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const updateWebsiteColors = async (colors) => { const res = await fetchWithRetry({ method: 'put', url: '/api/restaurant/website-design/colors', data: colors }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };

    // Integrations
    const getIntegrations = async () => { const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant/integrations' }); return res.data?.data ?? res.data; };
    const updateIntegration = async (integration, settingsPayload) => { const res = await fetchWithRetry({ method: 'put', url: `/api/restaurant/integrations/${integration}`, data: settingsPayload }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const toggleIntegration = async (integration, enabled) => { const res = await fetchWithRetry({ method: 'put', url: `/api/restaurant/integrations/${integration}/toggle`, data: { enabled } }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };

    // Policies & FAQs
    const getPolicies = async () => { const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant/policies' }); return res.data?.data ?? res.data; };
    const updatePolicies = async (policiesPayload) => { const res = await fetchWithRetry({ method: 'put', url: '/api/restaurant/policies', data: policiesPayload }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };

    const getFAQs = async () => { const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant/faqs' }); return res.data?.data ?? res.data; };
    const updateFAQs = async (faqs) => { const res = await fetchWithRetry({ method: 'put', url: '/api/restaurant/faqs', data: faqs }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const addFAQ = async (faq) => { const res = await fetchWithRetry({ method: 'post', url: '/api/restaurant/faqs', data: faq }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const updateFAQ = async (id, updates) => { const res = await fetchWithRetry({ method: 'put', url: `/api/restaurant/faqs/${id}`, data: updates }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };
    const removeFAQ = async (id) => { const res = await fetchWithRetry({ method: 'delete', url: `/api/restaurant/faqs/${id}` }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };

    // Export/Import
    const exportSettings = async () => { const res = await fetchWithRetry({ method: 'get', url: '/api/restaurant/export-settings' }); return res.data?.data ?? res.data; };
    const importSettings = async (payload) => { const res = await fetchWithRetry({ method: 'post', url: '/api/restaurant/import-settings', data: payload }); setCacheTimestamp(Date.now()); return res.data?.data ?? res.data; };

    // Batch save (array of { method, url, data, optimisticPatch })
    const batchSave = async (operations = []) => {
        const prev = settings;
        try {
            // Apply optimistic patches
            operations.forEach(op => { if (op.optimisticPatch) setSettings(s => ({ ...s, ...op.optimisticPatch })); });
            for (const op of operations) {
                await fetchWithRetry({ method: op.method || 'post', url: op.url, data: op.data }, { retries: op.retries || 2 });
            }
            setCacheTimestamp(Date.now());
            setTimeout(() => refreshSettings(), 300);
            return true;
        } catch (err) {
            setSettings(prev);
            throw err;
        }
    };

    // Debug
    const clearError = () => setError(null);
    const debugState = () => { console.log('Settings debug', { settings, loading, error, isOnline, queue: queueRef.current }); };

    // Undo support
    const undoLastChange = async () => {
        const entry = undoStackRef.current.pop();
        if (!entry) return null;
        try {
            if (entry.kind === 'systemCategory') {
                // restore previous category
                const prevCategory = entry.prevCategory || {};
                setSettings(s => ({ ...s, systemSettings: { ...(s.systemSettings || {}), [entry.category]: prevCategory } }));
                // attempt to persist
                await saveSystemCategory(entry.category, prevCategory, { optimistic: false });
                return { restored: true };
            }
            if (entry.kind === 'systemSettings') {
                setSettings(s => ({ ...s, systemSettings: entry.prevSystemSettings || {} }));
                await saveSystemSettings(entry.prevSystemSettings || {}, { optimistic: false });
                return { restored: true };
            }
            if (entry.kind === 'general') {
                setSettings(entry.prev || {});
                await saveGeneralSettings(entry.prev || {}, { optimistic: false });
                return { restored: true };
            }
        } catch (err) {
            console.error('[SettingsContext] undo failed', err);
            setError(err?.message || 'Undo failed');
            return { restored: false, error: err };
        }
    };

    const undoStackLength = () => (undoStackRef.current || []).length;

    // Validation helpers
    const validateLanding = (landing) => {
        const errors = {};
        if (!landing) {
            errors._ = 'Landing settings missing';
            return { valid: false, errors };
        }
        // hero title required
        if (!landing.hero || !(landing.hero.title || landing.hero.titleAr)) {
            errors.hero = 'Hero title is required in at least one language';
        }
        // services titles
        if (landing.services && Array.isArray(landing.services.items)) {
            landing.services.items.forEach((s, i) => {
                if (!s.title && !s.titleAr) errors[`services.items[${i}]`] = 'Service title required';
            });
        }
        const valid = Object.keys(errors).length === 0;
        return { valid, errors };
    };

    // Localized view
    const isArabic = i18n.language === 'ar';
    const localizedSettings = useMemo(() => {
        const localized = {
            ...settings,
            restaurantName: isArabic && settings.restaurantNameAr ? settings.restaurantNameAr : settings.restaurantName,
            description: isArabic && settings.descriptionAr ? settings.descriptionAr : settings.description,
            address: isArabic && settings.addressAr ? settings.addressAr : settings.address,
            about: {
                ...settings.about,
                title: isArabic && settings.about?.titleAr ? settings.about.titleAr : settings.about?.title,
                content: isArabic && settings.about?.contentAr ? settings.about.contentAr : settings.about?.content,
            },
            faqs: settings.faqs?.map(faq => ({ ...faq, question: isArabic && faq.questionAr ? faq.questionAr : faq.question, answer: isArabic && faq.answerAr ? faq.answerAr : faq.answer })) || [],
            policies: {
                ...settings.policies,
                terms: isArabic && settings.policies?.termsAr ? settings.policies.termsAr : settings.policies?.terms,
                privacy: isArabic && settings.policies?.privacyAr ? settings.policies.privacyAr : settings.policies?.privacy,
            }
        };
        return localized;
    }, [settings, isArabic]);

    return (
        <settingsContext.Provider value={{
            settings: localizedSettings,
            rawSettings: settings,
            loading,
            error,
            isOnline,
            cacheTimestamp,
            // Basic operations
            fetchSettings,
            refreshSettings,
            updateSettings,
            saveGeneralSettings,
            // System
            getSystemSettings,
            saveSystemCategory,
            saveSystemSettings,
            // Landing
            getLandingSettings,
            updateLandingSettings,
            importInstagramPosts,
            resetLandingPage,
            uploadLandingImage,
            // Assets
            uploadLogo,
            uploadFavicon,
            uploadMenuImage,
            // Services & Payments
            getServices,
            updateServices,
            toggleService,
            getPaymentMethods,
            addPaymentMethod,
            updatePaymentMethod,
            removePaymentMethod,
            togglePaymentMethod,
            // Website & Integration
            getWebsiteDesign,
            updateWebsiteDesign,
            updateWebsiteColors,
            getIntegrations,
            updateIntegration,
            toggleIntegration,
            // Policies & FAQs
            getPolicies,
            updatePolicies,
            getFAQs,
            updateFAQs,
            addFAQ,
            updateFAQ,
            removeFAQ,
            // Import/Export & batch
            exportSettings,
            importSettings,
            batchSave,
            // Offline & debug
            clearError,
            debugState,
            // Undo & validation
            undoLastChange,
            undoStackLength,
            validateLanding,
            // Sync state
            syncStatus,
            lastSyncedAt,
            // Queue
            queue: queueRef.current,
        }}>
            {children}
        </settingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(settingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};