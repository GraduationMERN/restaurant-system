import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../context/SettingContext';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviews } from '../../../redux/slices/reviewSlice';

export default function LandingSettings() {
  const { rawSettings, saveSystemCategory, loading, isOnline, uploadLandingImage, importInstagramPosts } = useSettings();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const existing = rawSettings?.systemSettings?.landing;

  

  // Full landing page settings structure with all white-label fields
  const [landing, setLanding] = useState({
    hero: { title: '', titleAr: '', subtitle: '', subtitleAr: '', image: '', enabled: true },
    about: { title: '', titleAr: '', content: '', contentAr: '', image: '', enabled: true },
    testimonials: { items: [], featuredIds: [], mode: 'all', enabled: true },
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importPreviewPosts, setImportPreviewPosts] = useState([]);
  const [importMode, setImportMode] = useState('merge'); // 'merge' or 'replace'

  // Load existing settings into local state - FIXED with deep merge
  useEffect(() => {
    if (existing) {
      console.log('[LandingSettings] Loaded existing:', existing);
      
      // Deep merge function to properly handle nested objects and arrays
      const deepMerge = (target, source) => {
        const output = { ...target };
        
        if (source && typeof source === 'object') {
          Object.keys(source).forEach(key => {
            // If source has this key
            if (source[key] !== undefined && source[key] !== null) {
              // Handle objects (but not arrays)
              if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                  output[key] = source[key];
                } else {
                  output[key] = deepMerge(target[key], source[key]);
                }
              } 
              // Handle arrays
              else if (Array.isArray(source[key])) {
                output[key] = source[key];
              }
              // Handle primitive values
              else {
                output[key] = source[key];
              }
            }
          });
        }
        return output;
      };
      
      setLanding(prev => {
        const merged = deepMerge(prev, existing);
        console.log('[LandingSettings] Merged state:', merged);
        return merged;
      });
    }
  }, [existing]);

  // Load reviews for admin selection
  const dispatch = useDispatch();
  const reviewsState = useSelector(s => s.reviews || { list: [], loading: false });
  useEffect(() => {
    // fetch approved reviews so admin can pick which to feature
    dispatch(fetchReviews());
  }, [dispatch]);

  // FIXED: Properly handle save with backend sync
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('[LandingSettings] Saving data:', landing);
      
      // Prepare data to match backend expectations
      const dataToSave = {
        ...landing,
        // Ensure all arrays are present
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
      
      // Save with the correct structure - backend expects just the category data
      const returned = await saveSystemCategory('landing', dataToSave);

      // Backend returns ONLY the category data, not full restaurant
      if (returned) {
        console.log('[LandingSettings] Save returned:', returned);
        
        // Update local state with returned data using deep merge
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
        
        setLanding(prev => deepMerge(prev, returned));
      }
      
      setSuccess('Landing page settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('[LandingSettings] Save error:', err);
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleHourChange = (day, field, value) => {
    setLanding(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleTestimonialAdd = () => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: [...(prev.testimonials.items || []), { 
          id: Date.now(), // Add unique ID
          name: '', 
          content: '', 
          rating: 5,
          image: '' 
        }],
      },
    }));
  };

  const handleTestimonialRemove = (idx) => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: (prev.testimonials.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  const handleTestimonialChange = (idx, key, value) => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: (prev.testimonials.items || []).map((t, i) =>
          i === idx ? { ...t, [key]: value } : t
        ),
      },
    }));
  };

  // Generic helper to set nested landing path (supports array indices like items[0])
  const setLandingPath = (path, value) => {
    const clone = JSON.parse(JSON.stringify(landing || {}));
    const parts = path.split('.');
    let cur = clone;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
        const key = arrayMatch[1];
        const idx = parseInt(arrayMatch[2], 10);
        cur[key] = cur[key] || [];
        if (i === parts.length - 1) {
          cur[key][idx] = value;
        } else {
          cur[key][idx] = cur[key][idx] || {};
          cur = cur[key][idx];
        }
      } else {
        if (i === parts.length - 1) {
          cur[part] = value;
        } else {
          cur[part] = cur[part] || {};
          cur = cur[part];
        }
      }
    }
    setLanding(clone);
  };

  // Upload helper that uses context uploadLandingImage and applies returned url into path
  const handleUploadToTarget = async (file, targetPath) => {
    if (!file) return null;
    try {
      // uploadLandingImage provided by SettingsContext
      const res = await uploadLandingImage(file, { target: targetPath });
      // res might be { url, restaurant } or { restaurant }
      const url = res?.url || res?.data?.url || (res?.restaurant && (() => {
        // attempt to read from returned restaurant normalized path
        const parts = targetPath.replace(/^landing\./, '').split('.');
        let val = res.restaurant.systemSettings?.landing;
        for (const p of parts) { if (!val) break; val = val[p]; }
        return val;
      })());
      if (url) setLandingPath(targetPath, url);
      return url;
    } catch (err) {
      console.error('[LandingSettings] upload failed', err);
      setError(err?.message || 'Upload failed');
      return null;
    }
  };

  // Reorder helper for arrays within landing (items arrays)
  const reorderArray = (arrayPath, fromIdx, toIdx) => {
    const arr = (arrayPath === 'testimonials.items') ? (landing.testimonials.items || [])
      : (arrayPath === 'services.items') ? (landing.services.items || [])
      : (arrayPath === 'instagram.posts') ? (landing.instagram.posts || [])
      : [];
    if (toIdx < 0 || toIdx >= arr.length) return;
    const clone = JSON.parse(JSON.stringify(landing));
    const a = arr.slice();
    const [item] = a.splice(fromIdx, 1);
    a.splice(toIdx, 0, item);
    if (arrayPath === 'testimonials.items') clone.testimonials.items = a;
    if (arrayPath === 'services.items') clone.services.items = a;
    if (arrayPath === 'instagram.posts') clone.instagram.posts = a;
    setLanding(clone);
  };

  // Admin can choose featured reviews from existing reviews in the system
  const toggleFeaturedReview = (reviewId) => {
    setLanding(prev => {
      const ids = new Set(prev.testimonials.featuredIds || []);
      if (ids.has(reviewId)) ids.delete(reviewId); else ids.add(reviewId);
      return { 
        ...prev, 
        testimonials: { 
          ...prev.testimonials, 
          featuredIds: Array.from(ids), 
          mode: 'selected' 
        } 
      };
    });
  };

  const setTestimonialsMode = (mode) => {
    setLanding(prev => ({ 
      ...prev, 
      testimonials: { 
        ...prev.testimonials, 
        mode 
      } 
    }));
  };

  // ADD: Service card management functions
  const handleAddService = () => {
    setLanding(prev => ({
      ...prev,
      services: {
        ...prev.services,
        items: [...(prev.services.items || []), {
          id: Date.now(),
          title: 'New Service',
          titleAr: 'خدمة جديدة',
          description: 'Service description',
          descriptionAr: 'وصف الخدمة',
          image: '',
          colorClass: 'text-blue-600 dark:text-blue-400',
          bgClass: 'bg-white dark:from-gray-800 dark:to-gray-900',
          imageBgClass: 'bg-white dark:bg-blue-900/30',
          navigate: '/',
          enabled: true
        }]
      }
    }));
  };

  const handleRemoveService = (serviceId) => {
    setLanding(prev => ({
      ...prev,
      services: {
        ...prev.services,
        items: (prev.services.items || []).filter(service => service.id !== serviceId)
      }
    }));
  };

  const handleServiceChange = (serviceId, key, value) => {
    setLanding(prev => ({
      ...prev,
      services: {
        ...prev.services,
        items: (prev.services.items || []).map(service => 
          service.id === serviceId ? { ...service, [key]: value } : service
        )
      }
    }));
  };

  // Instagram post management
  const handleAddInstagramPost = () => {
    setLanding(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        posts: [...(prev.instagram.posts || []), {
          id: Date.now(),
          image: '',
          caption: '',
          likes: '',
          comments: '',
          date: '',
          tags: [],
        }]
      }
    }));
  };

  const handleRemoveInstagramPost = (postId) => {
    setLanding(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        posts: (prev.instagram.posts || []).filter(p => p.id !== postId)
      }
    }));
  };

  const handleInstagramChange = (postId, key, value) => {
    setLanding(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        posts: (prev.instagram.posts || []).map(p =>
          p.id === postId ? { 
            ...p, 
            [key]: key === 'tags' ? (typeof value === 'string' ? value.split(',').map(s=>s.trim()).filter(Boolean) : value) : value 
          } : p
        )
      }
    }));
  };

  // Merge previewed imported posts with existing manual posts uniquely
  const mergeUniquePosts = (imported = [], existing = []) => {
    const seen = new Set();
    const normalizedKey = (p) => (p.permalink || p.image || p.id || p.caption || '').toString();
    const out = [];
    // Add imported first
    for (const p of imported) {
      const k = normalizedKey(p);
      if (!seen.has(k)) { seen.add(k); out.push(p); }
    }
    // Add existing only if not in imported
    for (const p of existing) {
      const k = normalizedKey(p);
      if (!seen.has(k)) { seen.add(k); out.push(p); }
    }
    return out;
  };

  // Debug function
  const logCurrentState = () => {
    console.log('=== CURRENT LANDING STATE ===');
    console.log('Full landing:', landing);
    console.log('Hero:', landing.hero);
    console.log('Services items:', landing.services.items);
    console.log('Services items count:', landing.services.items?.length);
    console.log('Testimonials:', landing.testimonials);
  };

  // Confirm and apply the import (persisted)
  const confirmImport = async () => {
    if (!landing._importUsername) return setError('Missing instagram username');
    setError(null);
    setSaving(true);
    try {
      // Persist import on server (this will fetch and save unless server configured differently)
      const returned = await importInstagramPosts({ username: landing._importUsername, count: 50, persist: true });
      const importedPosts = returned?.instagram?.posts || returned?.instagram?.posts || [];

      if (importMode === 'replace') {
        // Update local draft to returned landing if available
        if (returned) setLanding(prev => ({ ...prev, instagram: { ...(prev.instagram||{}), posts: importedPosts, enabled: true } }));
      } else {
        // Merge: combine imported with existing manual posts and persist via saveSystemCategory
        const existing = landing.instagram?.posts || [];
        const merged = mergeUniquePosts(importedPosts, existing);
        try {
          const saved = await saveSystemCategory('landing', { ...(landing), instagram: { ...(landing.instagram||{}), posts: merged } });
          // server returns category data; update local state
          if (saved) setLanding(prev => ({ ...prev, instagram: { ...(prev.instagram||{}), posts: saved.instagram?.posts || merged, enabled: saved.instagram?.enabled !== false } }));
        } catch (err) {
          console.error('Failed to save merged posts', err);
          setError(err?.message || 'Failed to save merged posts');
        }
      }

      setSuccess('Instagram import applied');
      setTimeout(()=>setSuccess(null), 3000);
    } catch (err) {
      console.error('Confirm import failed', err);
      setError(err?.message || 'Confirm import failed');
    } finally {
      setSaving(false);
      setShowImportConfirm(false);
      setImportPreviewPosts([]);
    }
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Landing Page Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure every visible element on your public landing page
          </p>
        </div>
        <button
          onClick={logCurrentState}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300"
        >
          Debug State
        </button>
        <div className="ml-4 text-sm text-gray-600 dark:text-gray-300">
          <div>Network: <strong className={`ml-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>{isOnline ? 'Online' : 'Offline'}</strong></div>
          <div>Queued: <strong>{(() => { try { return JSON.parse(localStorage.getItem('settings_offline_queue_v1')||'[]').length } catch { return 0 } })()}</strong></div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ✓ {success}
        </div>
      )}

      {/* Debug Info */}
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
        <div className="font-semibold mb-1">Debug Info:</div>
        <div>Loaded from backend: {existing ? 'Yes' : 'No'}</div>
        <div>Hero title: "{landing.hero.title}"</div>
        <div>Hero title (Arabic): "{landing.hero.titleAr}"</div>
        <div>Total testimonials: {(landing.testimonials.items || []).length}</div>
        <div>Total services: {(landing.services.items || []).length}</div>
        <div>Total Instagram posts: {(landing.instagram.posts || []).length}</div>
      </div>

      {/* Hero Section */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Hero Section</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.hero.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                hero: {
                  ...l.hero, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-3">
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Hero Title (English)"
            value={landing.hero.title || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              hero: { 
                ...l.hero, 
                title: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="العنوان الاساسي (عربي)"
            value={landing.hero.titleAr || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              hero: { 
                ...l.hero, 
                titleAr: e.target.value 
              } 
            }))}
          />
          <textarea
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Subtitle (English)"
            rows="2"
            value={landing.hero.subtitle || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              hero: { 
                ...l.hero, 
                subtitle: e.target.value 
              } 
            }))}
          />
          <textarea
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="العنوان الفرعي (عربي)"
            rows="2"
            value={landing.hero.subtitleAr || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              hero: { 
                ...l.hero, 
                subtitleAr: e.target.value 
              } 
            }))}
          />
          <input
  className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain rounded-full bg-white dark:bg-gray-700 p-1" 
            placeholder="Hero Image URL"
            value={landing.hero.image || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              hero: { 
                ...l.hero, 
                image: e.target.value 
              } 
            }))}
          />
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={async (e)=>{ const f = e.target.files && e.target.files[0]; if (f) await handleUploadToTarget(f, 'landing.hero.image'); }} />
            {landing.hero.image && <img src={landing.hero.image} alt="hero" className="h-16 object-contain rounded" />}
            <label className="flex items-center gap-2">
              <div className="text-xs">Hero BG</div>
              <input type="color" value={landing.hero.bgColor || '#ffffff'} onChange={(e)=>setLanding(l=>({...l, hero:{...l.hero, bgColor: e.target.value}}))} />
            </label>
            <label className="flex items-center gap-2">
              <div className="text-xs">Text Color</div>
              <input type="color" value={landing.hero.textColor || '#000000'} onChange={(e)=>setLanding(l=>({...l, hero:{...l.hero, textColor: e.target.value}}))} />
            </label>
          </div>
        </div>
      </section>

      {/* Import Confirmation Modal */}
      {showImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>{ setShowImportConfirm(false); setImportPreviewPosts([]); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 z-10">
            <h3 className="text-xl font-semibold mb-3">Preview Instagram Import</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Previewing {importPreviewPosts.length} posts for @{landing._importUsername}. Choose how to apply them:</p>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="importMode" checked={importMode==='merge'} onChange={()=>setImportMode('merge')} />
                <span className="text-sm">Merge with existing manual posts (keep both)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="importMode" checked={importMode==='replace'} onChange={()=>setImportMode('replace')} />
                <span className="text-sm">Replace existing Instagram posts</span>
              </label>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4 max-h-60 overflow-auto">
              {importPreviewPosts.slice(0, 24).map((p, i) => (
                <div key={i} className="rounded overflow-hidden bg-gray-100 dark:bg-gray-700 h-28 flex items-center justify-center">
                  {p.image ? <img src={p.image} alt={p.caption || 'post'} className="w-full h-full object-cover" /> : <div className="text-xs text-gray-500 p-2">No image</div>}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>{ setShowImportConfirm(false); setImportPreviewPosts([]); }}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={confirmImport} disabled={saving}>{saving ? 'Applying...' : 'Confirm Import'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Service Cards</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.services.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                services: {
                  ...l.services, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-4">
          {(landing.services.items || []).map((service, idx) => (
            <div key={service.id || idx} className="border rounded p-3 bg-white dark:bg-gray-700 space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 border rounded text-sm"
                  placeholder="Service Title (English)"
                  value={service.title || ''}
                  onChange={(e) => handleServiceChange(service.id, 'title', e.target.value)}
                />
                <input
                  className="flex-1 p-2 border rounded text-sm"
                  placeholder="Service Title (Arabic)"
                  value={service.titleAr || ''}
                  onChange={(e) => handleServiceChange(service.id, 'titleAr', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 border rounded text-sm"
                  placeholder="Description (English)"
                  value={service.description || ''}
                  onChange={(e) => handleServiceChange(service.id, 'description', e.target.value)}
                />
                <input
                  className="flex-1 p-2 border rounded text-sm"
                  placeholder="Description (Arabic)"
                  value={service.descriptionAr || ''}
                  onChange={(e) => handleServiceChange(service.id, 'descriptionAr', e.target.value)}
                />
              </div>
              <input
                className="w-full p-2 border rounded text-sm"
                placeholder="Image URL"
                value={service.image || ''}
                onChange={(e) => handleServiceChange(service.id, 'image', e.target.value)}
              />
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (f) await handleUploadToTarget(f, `landing.services.items[${idx}].image`); }} />
                {service.image && <img src={service.image} alt="service" className="h-12 object-contain rounded" />}
                <div className="ml-auto flex gap-2">
                  <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={()=>reorderArray('services.items', idx, idx-1)}>&uarr;</button>
                  <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={()=>reorderArray('services.items', idx, idx+1)}>&darr;</button>
                </div>
              </div>
              <input
                className="w-full p-2 border rounded text-sm"
                placeholder="Navigation Link (e.g., /menu)"
                value={service.navigate || ''}
                onChange={(e) => handleServiceChange(service.id, 'navigate', e.target.value)}
              />
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={service.enabled !== false}
                    onChange={(e) => handleServiceChange(service.id, 'enabled', e.target.checked)}
                  />
                  <span className="text-sm">Enabled</span>
                </label>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  onClick={() => handleRemoveService(service.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleAddService}
          >
            + Add Service Card
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">About Section</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.about.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                about: {
                  ...l.about, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-3">
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="About Title (English)"
            value={landing.about.title || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              about: { 
                ...l.about, 
                title: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="عنوان حول (عربي)"
            value={landing.about.titleAr || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              about: { 
                ...l.about, 
                titleAr: e.target.value 
              } 
            }))}
          />
          <textarea
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="About Content (English)"
            rows="4"
            value={landing.about.content || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              about: { 
                ...l.about, 
                content: e.target.value 
              } 
            }))}
          />
          <textarea
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="محتوى حول (عربي)"
            rows="4"
            value={landing.about.contentAr || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              about: { 
                ...l.about, 
                contentAr: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="About Image URL"
            value={landing.about.image || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              about: { 
                ...l.about, 
                image: e.target.value 
              } 
            }))}
          />
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={async (e)=>{ const f = e.target.files && e.target.files[0]; if (f) await handleUploadToTarget(f, 'landing.about.image'); }} />
            {landing.about.image && <img src={landing.about.image} alt="about" className="h-16 object-contain rounded" />}
          </div>
        </div>
      </section>

      {/* Location & Address */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold"> Location & Address</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.location.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                location: {
                  ...l.location, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-3">
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Street Address (English)"
            value={landing.location.address || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              location: { 
                ...l.location, 
                address: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="عنوان الشارع (عربي)"
            value={landing.location.addressAr || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              location: { 
                ...l.location, 
                addressAr: e.target.value 
              } 
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="p-2 border rounded bg-white dark:bg-gray-700"
              type="number"
              step="0.0001"
              placeholder="Latitude"
              value={landing.location.latitude || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                location: { 
                  ...l.location, 
                  latitude: e.target.value 
                } 
              }))}
            />
            <input
              className="p-2 border rounded bg-white dark:bg-gray-700"
              type="number"
              step="0.0001"
              placeholder="Longitude"
              value={landing.location.longitude || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                location: { 
                  ...l.location, 
                  longitude: e.target.value 
                } 
              }))}
            />
          </div>
        </div>
      </section>

      {/* Opening Hours */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold"> Opening Hours</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={Object.values(landing.hours || {}).some(d=>d.enabled !== false)} 
              onChange={(e)=>{
                const enabled = e.target.checked;
                setLanding(prev=>({
                  ...prev,
                  hours: Object.fromEntries(Object.entries(prev.hours||{}).map(([k,v])=>[k,{...v, enabled}]))
                }))
              }} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-2">
          {Object.entries(landing.hours).map(([day, times]) => (
            <div key={day} className="flex items-center gap-3">
              <label className="w-24 font-medium capitalize">{day}</label>
              <input
                type="time"
                className="p-2 border rounded bg-white dark:bg-gray-700 w-24"
                value={times.open || '11:00'}
                onChange={(e) => handleHourChange(day, 'open', e.target.value)}
              />
              <span>-</span>
              <input
                type="time"
                className="p-2 border rounded bg-white dark:bg-gray-700 w-24"
                value={times.close || '22:00'}
                onChange={(e) => handleHourChange(day, 'close', e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Contact Info */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold"> Contact Information</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.contact.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                contact: {
                  ...l.contact, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-3">
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            type="email"
            placeholder="Email"
            value={landing.contact.email || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              contact: { 
                ...l.contact, 
                email: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Phone (Display)"
            value={landing.contact.phone || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              contact: { 
                ...l.contact, 
                phone: e.target.value 
              } 
            }))}
          />
        </div>
      </section>

      {/* Call Us Number */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold"> Call Us Number (Hotline)</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.callUs.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                callUs: {
                  ...l.callUs, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-3">
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Call-Us Number (English)"
            value={landing.callUs.number || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              callUs: { 
                ...l.callUs, 
                number: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="رقم الاتصال (عربي)"
            value={landing.callUs.numberAr || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              callUs: { 
                ...l.callUs, 
                numberAr: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Label (English) - e.g., 'Call Us', 'Hotline'"
            value={landing.callUs.label || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              callUs: { 
                ...l.callUs, 
                label: e.target.value 
              } 
            }))}
          />
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="التسمية (عربي) - مثل 'اتصل بنا'"
            value={landing.callUs.labelAr || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              callUs: { 
                ...l.callUs, 
                labelAr: e.target.value 
              } 
            }))}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold"> Testimonials</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.testimonials.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                testimonials: {
                  ...l.testimonials, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-4">
          {(landing.testimonials.items || []).map((tst, idx) => (
            <div key={tst.id || idx} className="border rounded p-3 bg-white dark:bg-gray-700 space-y-2">
              <input
                className="w-full p-2 border rounded text-sm"
                placeholder="Customer Name"
                value={tst.name || ''}
                onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)}
              />
              <input
                className="w-full p-2 border rounded text-sm"
                placeholder="Customer Image URL (optional)"
                value={tst.image || ''}
                onChange={(e) => handleTestimonialChange(idx, 'image', e.target.value)}
              />
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={async (e)=>{ const f = e.target.files && e.target.files[0]; if (f) await handleUploadToTarget(f, `landing.testimonials.items[${idx}].image`); }} />
                {tst.image && <img src={tst.image} alt="testi" className="h-12 object-contain rounded" />}
                <div className="ml-auto flex gap-2">
                  <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={()=>reorderArray('testimonials.items', idx, idx-1)}>&uarr;</button>
                  <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={()=>reorderArray('testimonials.items', idx, idx+1)}>&darr;</button>
                </div>
              </div>
              <textarea
                className="w-full p-2 border rounded text-sm"
                placeholder="Testimonial Content"
                rows="2"
                value={tst.content || ''}
                onChange={(e) => handleTestimonialChange(idx, 'content', e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <label className="text-sm">Rating:</label>
                <select
                  className="p-2 border rounded text-sm"
                  value={tst.rating || 5}
                  onChange={(e) => handleTestimonialChange(idx, 'rating', Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} </option>
                  ))}
                </select>
                <button
                  className="ml-auto px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  onClick={() => handleTestimonialRemove(idx)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleTestimonialAdd}
          >
            + Add Testimonial
          </button>
        </div>
      </section>

      {/* Featured Reviews selection (uses Redux reviews) */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Featured Reviews</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="reviewsMode" 
                checked={(landing.testimonials.mode || 'all') === 'all'} 
                onChange={() => setTestimonialsMode('all')} 
              />
              <span className="text-sm">Show All Approved Reviews</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="reviewsMode" 
                checked={(landing.testimonials.mode || 'all') === 'selected'} 
                onChange={() => setTestimonialsMode('selected')} 
              />
              <span className="text-sm">Select Reviews To Feature</span>
            </label>
          </div>

          <div className="p-2 bg-white dark:bg-gray-700 rounded">
            <div className="text-sm font-medium mb-2">Available Reviews</div>
            {reviewsState.loading && <div className="text-xs">Loading reviews...</div>}
            {(reviewsState.list || []).slice(0, 50).map(r => (
              <label key={r._id} className="flex items-center gap-2 text-sm py-1">
                <input 
                  type="checkbox" 
                  checked={(landing.testimonials.featuredIds || []).includes(r._id)} 
                  onChange={() => toggleFeaturedReview(r._id)} 
                />
                <div className="flex-1">
                  <div className="font-semibold">{r.name || r.userName || 'Reviewer'}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {(r.comment || r.content || '').slice(0, 80)}
                  </div>
                </div>
                <div className="text-xs opacity-80">{r.rating} ⭐</div>
              </label>
            ))}
            {!(reviewsState.list || []).length && <div className="text-xs text-gray-500">No reviews found.</div>}
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Instagram Posts</h3>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={landing.instagram.enabled !== false} 
                onChange={(e)=>setLanding(l=>({
                  ...l, 
                  instagram: {
                    ...l.instagram, 
                    enabled: e.target.checked
                  }
                }))} 
              />
              Enabled
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              placeholder="instagram username"
              value={landing._importUsername || ''}
              onChange={(e)=>setLanding(l=>({...l, _importUsername: e.target.value}))}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-sm"
            />
            <button
              className="px-3 py-2 bg-pink-500 text-white rounded text-sm"
              onClick={async ()=>{
                if (!landing._importUsername) return setError('Enter Instagram username to import');
                setError(null);
                setSaving(true);
                try {
                  // Preview fetch (do not persist)
                  const returned = await importInstagramPosts({ username: landing._importUsername, count: 12, persist: false });
                  const posts = returned?.instagram?.posts || [];
                  if (!posts.length) return setError('No posts returned from Instagram');
                  setImportPreviewPosts(posts);
                  setImportMode('merge');
                  setShowImportConfirm(true);
                } catch (err) {
                  console.error('Import preview failed', err);
                  // Prefer server-provided message when available
                  const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
                  setError(serverMsg || 'Import preview failed');
                } finally { setSaving(false); }
              }}
            >
              {saving ? 'Fetching...' : 'Preview Import'}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {(landing.instagram.posts || []).map((post, idx) => (
            <div key={post.id || idx} className="border rounded p-3 bg-white dark:bg-gray-700 space-y-2">
              <input
                className="w-full p-2 border rounded text-sm"
                placeholder="Image URL"
                value={post.image || ''}
                onChange={(e) => handleInstagramChange(post.id, 'image', e.target.value)}
              />
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={async (e)=>{ const f = e.target.files && e.target.files[0]; if (f) await handleUploadToTarget(f, `landing.instagram.posts[${idx}].image`); }} />
                {post.image && <img src={post.image} alt="insta" className="h-12 object-contain rounded" />}
                <div className="ml-auto flex gap-2">
                  <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={()=>reorderArray('instagram.posts', idx, idx-1)}>&uarr;</button>
                  <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={()=>reorderArray('instagram.posts', idx, idx+1)}>&darr;</button>
                </div>
              </div>
              <input
                className="w-full p-2 border rounded text-sm"
                placeholder="Caption"
                value={post.caption || ''}
                onChange={(e) => handleInstagramChange(post.id, 'caption', e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="p-2 border rounded text-sm"
                  placeholder="Likes"
                  value={post.likes || ''}
                  onChange={(e) => handleInstagramChange(post.id, 'likes', e.target.value)}
                />
                <input
                  className="p-2 border rounded text-sm"
                  placeholder="Comments"
                  value={post.comments || ''}
                  onChange={(e) => handleInstagramChange(post.id, 'comments', e.target.value)}
                />
                <input
                  className="p-2 border rounded text-sm"
                  placeholder="Date (e.g., '2 days ago')"
                  value={post.date || ''}
                  onChange={(e) => handleInstagramChange(post.id, 'date', e.target.value)}
                />
              </div>
              <input
                className="w-full p-2 border rounded text-sm"
                placeholder="Tags (comma separated)"
                value={(post.tags || []).join(', ')}
                onChange={(e) => handleInstagramChange(post.id, 'tags', e.target.value)}
              />
              <div className="flex justify-end">
                <button 
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600" 
                  onClick={() => handleRemoveInstagramPost(post.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button 
            className="w-full p-2 bg-pink-500 text-white rounded hover:bg-pink-600" 
            onClick={handleAddInstagramPost}
          >
            + Add Instagram Post
          </button>
        </div>
      </section>

      {/* Footer */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Footer</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.footer.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                footer: {
                  ...l.footer, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <textarea
          className="w-full p-2 border rounded bg-white dark:bg-gray-700"
          placeholder="Footer copyright text"
          rows="2"
          value={landing.footer.text || ''}
          onChange={(e) => setLanding(l => ({ 
            ...l, 
            footer: { 
              ...l.footer, 
              text: e.target.value 
            } 
          }))}
        />
      </section>

      {/* SEO */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold"> SEO Settings</h3>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={landing.seo.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                seo: {
                  ...l.seo, 
                  enabled: e.target.checked
                }
              }))} 
            />
            Enabled
          </label>
        </div>
        <div className="space-y-3">
          <input
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Page Title (for browser)"
            value={landing.seo.title || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              seo: { 
                ...l.seo, 
                title: e.target.value 
              } 
            }))}
          />
          <textarea
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Meta Description (for search engines)"
            rows="2"
            value={landing.seo.description || ''}
            onChange={(e) => setLanding(l => ({ 
              ...l, 
              seo: { 
                ...l.seo, 
                description: e.target.value 
              } 
            }))}
          />
        </div>
      </section>

      {/* Save Button */}
<div className="flex gap-3 justify-end pt-6 border-t">
  <button
    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
    onClick={() => {
      // Reset to default structure
      setLanding({
        hero: { title: '', titleAr: '', subtitle: '', subtitleAr: '', image: '', enabled: true },
        about: { title: '', titleAr: '', content: '', contentAr: '', image: '', enabled: true },
        testimonials: { items: [], featuredIds: [], mode: 'all', enabled: true },
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
      setSuccess('Form reset to defaults. Click Save to persist.');
    }}
  >
    Reset Form
  </button>
  <button
    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    onClick={handleSave}
    disabled={saving || loading}
  >
    {saving ? 'Saving...' : 'Save All Settings'}
  </button>
</div>
    </div>
  );
}
