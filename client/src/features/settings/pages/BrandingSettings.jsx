import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsAPI } from '../hooks/useSettingsAPI';
import { Save, AlertCircle, Upload, X } from 'lucide-react';

export default function BrandingSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [branding, setBranding] = useState({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#FF5733',
    secondaryColor: '#33C3FF',
    accentColor: '#FFB800',
    brandName: '',
    brandNameAr: '',
    tagline: '',
    taglineAr: '',
    description: '',
    descriptionAr: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { updateSystemCategory, uploadLogo } = useSettingsAPI();

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    setLoading(true);
    // Fetch branding from system settings
    try {
      // Since we don't have a specific branding endpoint, we can update this
      // to fetch from system settings if needed
      setBranding((prev) => ({ ...prev }));
    } catch (err) {
      console.error('Error loading branding:', err);
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setBranding((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleColorChange = (colorField, value) => {
    setBranding((prev) => ({
      ...prev,
      [colorField]: value,
    }));
    setHasChanges(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadLogo(file);
    if (result?.logoUrl) {
      setBranding((prev) => ({
        ...prev,
        logoUrl: result.logoUrl,
      }));
      setHasChanges(true);
    }
    setUploading(false);
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Note: You'll need to implement favicon upload in the backend
      const formData = new FormData();
      formData.append('favicon', file);
      // await api.post('/api/restaurant/upload-favicon', formData);
      setBranding((prev) => ({
        ...prev,
        faviconUrl: URL.createObjectURL(file),
      }));
      setHasChanges(true);
    } catch (err) {
      console.error('Error uploading favicon:', err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSystemCategory('branding', {
      branding: {
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        brandName: branding.brandName,
        brandNameAr: branding.brandNameAr,
        tagline: branding.tagline,
        taglineAr: branding.taglineAr,
        description: branding.description,
        descriptionAr: branding.descriptionAr,
      },
    });
    if (success) {
      setHasChanges(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {isRTL
            ? 'تخصيص هوية العلامة التجارية الخاصة بك مع الألوان والشعارات'
            : 'Customize your brand identity with logos, colors, and messaging'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo Upload */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'شعار المتجر' : 'Store Logo'}
            </h3>

            <div className="flex items-center gap-6">
              {branding.logoUrl && (
                <div className="relative">
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="h-32 w-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={() =>
                      setBranding((prev) => ({ ...prev, logoUrl: '' }))
                    }
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex-1">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="cursor-pointer flex items-center justify-center w-full px-6 py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {uploading
                          ? isRTL
                            ? 'جاري الرفع...'
                            : 'Uploading...'
                          : isRTL
                          ? 'اضغط لتحميل الشعار'
                          : 'Click to upload logo'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG, GIF (Max 5MB)
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'أيقونة الموقع' : 'Favicon (Browser Icon)'}
            </h3>

            <div className="flex items-center gap-6">
              {branding.faviconUrl && (
                <div className="relative">
                  <img
                    src={branding.faviconUrl}
                    alt="Favicon"
                    className="h-16 w-16 object-cover rounded border-2 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={() =>
                      setBranding((prev) => ({ ...prev, faviconUrl: '' }))
                    }
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex-1">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="cursor-pointer flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {uploading
                          ? isRTL
                            ? 'جاري الرفع...'
                            : 'Uploading...'
                          : isRTL
                          ? 'اضغط لتحميل الأيقونة'
                          : 'Click to upload favicon'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Square image (Max 1MB)
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Brand Information */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isRTL ? 'معلومات العلامة التجارية' : 'Brand Information'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'اسم العلامة (English)' : 'Brand Name (English)'}
                </label>
                <input
                  type="text"
                  value={branding.brandName}
                  onChange={(e) =>
                    handleInputChange('brandName', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Brand Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'اسم العلامة (عربي)' : 'Brand Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={branding.brandNameAr}
                  onChange={(e) =>
                    handleInputChange('brandNameAr', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم العلامة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الشعار (English)' : 'Tagline (English)'}
                </label>
                <input
                  type="text"
                  value={branding.tagline}
                  onChange={(e) =>
                    handleInputChange('tagline', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your brand tagline"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الشعار (عربي)' : 'Tagline (Arabic)'}
                </label>
                <input
                  type="text"
                  value={branding.taglineAr}
                  onChange={(e) =>
                    handleInputChange('taglineAr', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="شعار العلامة"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الوصف (English)' : 'Description (English)'}
                </label>
                <textarea
                  value={branding.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brand description"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  value={branding.descriptionAr}
                  onChange={(e) =>
                    handleInputChange('descriptionAr', e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف العلامة"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isRTL ? 'لوحة الألوان' : 'Color Palette'}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {isRTL ? 'اللون الأساسي' : 'Primary Color'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    handleColorChange('primaryColor', e.target.value)
                  }
                  className="h-12 w-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    handleColorChange('primaryColor', e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {isRTL ? 'اللون الثانوي' : 'Secondary Color'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    handleColorChange('secondaryColor', e.target.value)
                  }
                  className="h-12 w-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    handleColorChange('secondaryColor', e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {isRTL ? 'لون الأكسنت' : 'Accent Color'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) =>
                    handleColorChange('accentColor', e.target.value)
                  }
                  className="h-12 w-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) =>
                    handleColorChange('accentColor', e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Color Preview */}
            <div className="pt-4 border-t border-gray-300 dark:border-gray-600 space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isRTL ? 'معاينة' : 'Preview'}
              </p>
              <div
                className="h-8 rounded"
                style={{ backgroundColor: branding.primaryColor }}
              />
              <div
                className="h-8 rounded"
                style={{ backgroundColor: branding.secondaryColor }}
              />
              <div
                className="h-8 rounded"
                style={{ backgroundColor: branding.accentColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => loadBranding()}
          disabled={!hasChanges}
          className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {isRTL ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : isRTL ? 'حفظ' : 'Save'}
        </button>
      </div>
    </div>
  );
}
