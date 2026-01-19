import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../../context/SettingContext';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviews } from '../../../redux/slices/reviewSlice';
import { Save, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import SettingsSidebar from '../components/SettingsSidebar';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';
import AboutSection from '../components/AboutSection';
import TableBookingSection from '../components/TableBookingSection';
import ContactLocationHoursSection from '../components/ContactLocationHoursSection';
import CallUsSection from '../components/CallUsSection';
import TestimonialsSection from '../components/TestimonialsSection';
import InstagramSection from '../components/InstagramSection';
import FooterSEOSection from '../components/FooterSEOSection';

export default function LandingSettingsRefactored() {
  const { rawSettings, saveSystemCategory, loading, isOnline, uploadLandingImage, importInstagramPosts } = useSettings();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const existing = rawSettings?.systemSettings?.landing;
  const dispatch = useDispatch();
  const reviewsState = useSelector(s => s.reviews || { list: [], loading: false });

  // State
  const [landing, setLanding] = useState({
    hero: { title: '', titleAr: '', subtitle: '', subtitleAr: '', image: '', enabled: true },
    about: { title: '', titleAr: '', content: '', contentAr: '', image: '', enabled: true },
    tableBooking: { enabled: true, showOnLanding: true, title: 'Book a Table', titleAr: 'احجز طاولة', description: 'Reserve a table at our restaurant', descriptionAr: 'احجز طاولة في مطعمنا', buttonText: 'Book Now', buttonTextAr: 'احجز الآن' },
    testimonials: { items: [], featuredIds: [], mode: 'all', title: 'What People Say', titleAr: 'ما يقوله الناس', enabled: true },
    contact: { email: '', phone: '', enabled: true },
    callUs: { number: '', numberAr: '', label: 'Call Us', labelAr: 'اتصل بنا', enabled: true },
    location: { address: '', addressAr: '', latitude: '', longitude: '', enabled: true },
    hours: {
      monday: { open: '11:00', close: '22:00', enabled: true },
      tuesday: { open: '11:00', close: '22:00', enabled: true },
      wednesday: { open: '11:00', close: '22:00', enabled: true },
      thursday: { open: '11:00', close: '22:00', enabled: true },
      friday: { open: '11:00', close: '23:00', enabled: true },
      saturday: { open: '10:00', close: '23:00', enabled: true },
      sunday: { open: '10:00', close: '22:00', enabled: true },
    },
    footer: { text: '', enabled: true },
    seo: { title: '', description: '', enabled: true },
    services: { enabled: true, items: [] },
    instagram: { enabled: true, posts: [] },
    specialOffer: { enabled: true }
  });

  const [activeSection, setActiveSection] = useState('hero');
  const [unsavedSections, setUnsavedSections] = useState([]);
  const [sectionErrors, setSectionErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unique ID generator
  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load existing settings
  useEffect(() => {
    if (existing) {
      const deepMerge = (target, source) => {
        const output = { ...target };
        if (source && typeof source === 'object') {
          Object.keys(source).forEach(key => {
            if (source[key] !== undefined && source[key] !== null) {
              if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                  output[key] = source[key];
                } else {
                  output[key] = deepMerge(target[key], source[key]);
                }
              } else if (Array.isArray(source[key])) {
                output[key] = source[key];
              } else {
                output[key] = source[key];
              }
            }
          });
        }
        return output;
      };
      
      setLanding(prev => {
        const merged = deepMerge(prev, existing);
        // Ensure each service item has a stable unique id to avoid shared updates
        if (merged.services && Array.isArray(merged.services.items)) {
          merged.services.items = merged.services.items.map(item => ({
            ...item,
            id: item.id || generateUniqueId(),
          }));
        }
        return merged;
      });
    }
  }, [existing]);

  // Load reviews
  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  // Track section changes
  const handleLandingChange = useCallback((newLanding) => {
    setLanding(newLanding);
    if (!unsavedSections.includes(activeSection)) {
      setUnsavedSections(prev => [...prev, activeSection]);
    }
  }, [activeSection, unsavedSections]);

  // Upload handler
  const handleUploadToTarget = async (file, targetPath) => {
    if (!file) return null;
    try {
      const res = await uploadLandingImage(file, { target: targetPath });
      const url = res?.url || res?.data?.url;
      if (url) {
        const parts = targetPath.replace(/^landing\./, '').split('.');
        let current = landing;
        const pathParts = parts.slice(0, -1);
        for (const p of pathParts) {
          current = current[p] || {};
        }
        const key = parts[parts.length - 1];
        setLanding(prev => {
          const newState = JSON.parse(JSON.stringify(prev));
          let target = newState;
          for (const p of pathParts) {
            target = target[p];
          }
          target[key] = url;
          return newState;
        });
      }
      return url;
    } catch (err) {
      console.error('Upload failed', err);
      setError(err?.message || 'Upload failed');
      return null;
    }
  };

  // Reorder array helper
  const reorderArray = (arrayPath, fromIdx, toIdx) => {
    const arr = arrayPath === 'services.items' ? (landing.services.items || [])
      : arrayPath === 'instagram.posts' ? (landing.instagram.posts || [])
      : [];
    if (toIdx < 0 || toIdx >= arr.length) return;
    
    const clone = JSON.parse(JSON.stringify(landing));
    const a = arr.slice();
    const [item] = a.splice(fromIdx, 1);
    a.splice(toIdx, 0, item);
    
    if (arrayPath === 'services.items') clone.services.items = a;
    if (arrayPath === 'instagram.posts') clone.instagram.posts = a;
    
    setLanding(clone);
    handleLandingChange(clone);
  };

  // Save section
  const handleSaveSection = async (section) => {
    setSaving(true);
    setError(null);
    try {
      const dataToSave = {
        ...landing,
        testimonials: {
          ...landing.testimonials,
          items: landing.testimonials.items || [],
          featuredIds: landing.testimonials.featuredIds || []
        },
        services: {
          ...landing.services,
          items: landing.services.items || []
        },
        instagram: {
          ...landing.instagram,
          posts: landing.instagram.posts || []
        }
      };
      
      await saveSystemCategory('landing', dataToSave);
      setUnsavedSections(prev => prev.filter(s => s !== section));
      setSuccess(`${section} saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setSectionErrors(prev => ({ ...prev, [section]: err?.message || 'Save failed' }));
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Save all sections
  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const dataToSave = {
        ...landing,
        testimonials: {
          ...landing.testimonials,
          items: landing.testimonials.items || [],
          featuredIds: landing.testimonials.featuredIds || []
        },
        services: {
          ...landing.services,
          items: landing.services.items || []
        },
        instagram: {
          ...landing.instagram,
          posts: landing.instagram.posts || []
        }
      };
      
      await saveSystemCategory('landing', dataToSave);
      setUnsavedSections([]);
      setSectionErrors({});
      setSuccess('All settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[LandingSettings] Save error:', err);
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'hero':
        return <HeroSection landing={landing} setLanding={handleLandingChange} handleUploadToTarget={handleUploadToTarget} isRTL={isRTL} />;
      case 'services':
        return <ServicesSection landing={landing} setLanding={handleLandingChange} handleUploadToTarget={handleUploadToTarget} generateUniqueId={generateUniqueId} reorderArray={reorderArray} isRTL={isRTL} />;
      case 'about':
        return <AboutSection landing={landing} setLanding={handleLandingChange} handleUploadToTarget={handleUploadToTarget} isRTL={isRTL} />;
      case 'tables':
        return <TableBookingSection landing={landing} setLanding={handleLandingChange} isRTL={isRTL} />;
      case 'contact':
        return <ContactLocationHoursSection landing={landing} setLanding={handleLandingChange} isRTL={isRTL} />;
      case 'callus':
        return <CallUsSection landing={landing} setLanding={handleLandingChange} isRTL={isRTL} />;
      case 'testimonials':
        return <TestimonialsSection landing={landing} setLanding={handleLandingChange} isRTL={isRTL} generateUniqueId={generateUniqueId} />;
      case 'instagram':
        return <InstagramSection landing={landing} setLanding={handleLandingChange} isRTL={isRTL} generateUniqueId={generateUniqueId} />;
      case 'footer':
        return <FooterSEOSection landing={landing} setLanding={handleLandingChange} isRTL={isRTL} />;
      default:
        return <div className="p-6 text-gray-500 dark:text-gray-400">Coming soon...</div>;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Sidebar */}
      <SettingsSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        unsavedSections={unsavedSections}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={(open) => setMobileMenuOpen(open === true ? true : false)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Landing Page Settings</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure your public landing page</p>
              </div>
              {unsavedSections.length > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                  <AlertCircle size={18} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    {unsavedSections.length} unsaved
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg flex items-start gap-3">
              <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          {/* Section Content */}
          <div>
            {renderSectionContent()}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-lg shadow-sm flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => {
                if (unsavedSections.includes(activeSection)) {
                  handleSaveSection(activeSection);
                }
              }}
              disabled={!unsavedSections.includes(activeSection) || saving}
              className="w-full sm:w-auto px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save This Section'}
            </button>
            
            <button
              onClick={handleSaveAll}
              disabled={unsavedSections.length === 0 || saving}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={20} />
              {saving ? 'Saving All...' : `Save All (${unsavedSections.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
