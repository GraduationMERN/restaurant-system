import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsAPI } from '../hooks/useSettingsAPI';
import {
  Save,
  AlertCircle,
  Eye,
  Settings,
  Globe,
  Share2,
  Code,
} from 'lucide-react';

export default function WebsiteDesignSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');
  const [design, setDesign] = useState({
    colors: {
      primary: '#FF5733',
      secondary: '#33C3FF',
      accent: '#FFB800',
      background: '#FFFFFF',
      text: '#333333',
    },
    fonts: {
      primary: 'Poppins',
      secondary: 'Open Sans',
    },
    domain: {
      subdomain: '',
    },
    seo: {
      title: '',
      description: '',
      keywords: '',
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      linkedin: '',
    },
    customCode: {
      header: '',
      footer: '',
    },
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { getWebsiteDesign, updateWebsiteDesign, updateWebsiteColors } =
    useSettingsAPI();

  useEffect(() => {
    loadDesign();
  }, []);

  const loadDesign = async () => {
    setLoading(true);
    const data = await getWebsiteDesign();
    if (data) {
      setDesign((prev) => ({ ...prev, ...data }));
    }
    setLoading(false);
  };

  const handleColorChange = (colorKey, value) => {
    setDesign((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleFontChange = (fontKey, value) => {
    setDesign((prev) => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [fontKey]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleDomainChange = (field, value) => {
    setDesign((prev) => ({
      ...prev,
      domain: {
        ...prev.domain,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSeoChange = (field, value) => {
    setDesign((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSocialChange = (platform, value) => {
    setDesign((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleCustomCodeChange = (section, value) => {
    setDesign((prev) => ({
      ...prev,
      customCode: {
        ...prev.customCode,
        [section]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await updateWebsiteDesign(design);
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

  const fontOptions = [
    'Poppins',
    'Open Sans',
    'Roboto',
    'Inter',
    'Lato',
    'Montserrat',
    'Playfair Display',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {isRTL
            ? 'تخصيص مظهر موقع الويب الخاص بك. التغييرات ستظهر فوراً في المعاينة.'
            : 'Customize your website appearance with colors, fonts, and content'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'colors', label: isRTL ? 'الألوان' : 'Colors', icon: '🎨' },
              { id: 'fonts', label: isRTL ? 'الخطوط' : 'Fonts', icon: '🔤' },
              { id: 'domain', label: isRTL ? 'النطاق' : 'Domain', icon: '🌐' },
              { id: 'seo', label: isRTL ? 'SEO' : 'SEO', icon: '📊' },
              { id: 'social', label: isRTL ? 'التواصل' : 'Social', icon: '👥' },
              { id: 'code', label: isRTL ? 'الكود' : 'Code', icon: '💻' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              {Object.entries(design.colors).map(([colorKey, value]) => (
                <div key={colorKey} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                      {isRTL
                        ? {
                            primary: 'اللون الأساسي',
                            secondary: 'اللون الثانوي',
                            accent: 'لون الأكسنت',
                            background: 'لون الخلفية',
                            text: 'لون النص',
                          }[colorKey]
                        : colorKey}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        handleColorChange(colorKey, e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) =>
                        handleColorChange(colorKey, e.target.value)
                      }
                      className="h-12 w-12 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fonts Tab */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              {Object.entries(design.fonts).map(([fontKey, value]) => (
                <div key={fontKey}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {isRTL
                      ? fontKey === 'primary'
                        ? 'الخط الأساسي'
                        : 'الخط الثانوي'
                      : fontKey}
                  </label>
                  <select
                    value={value}
                    onChange={(e) => handleFontChange(fontKey, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Domain Tab */}
          {activeTab === 'domain' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'النطاق الفرعي' : 'Subdomain'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={design.domain.subdomain}
                    onChange={(e) =>
                      handleDomainChange('subdomain', e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="myrestaurant"
                  />
                  <span className="text-gray-500 dark:text-gray-400">
                    .brandbite.com
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {isRTL
                    ? 'النطاق الفرعي لموقع الويب الخاص بك'
                    : 'Your website subdomain'}
                </p>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'عنوان الصفحة' : 'Page Title'}
                </label>
                <input
                  type="text"
                  value={design.seo.title}
                  onChange={(e) => handleSeoChange('title', e.target.value)}
                  maxLength={60}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Restaurant Name - Best Dining Experience"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {design.seo.title.length}/60 {isRTL ? 'حرف' : 'characters'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الوصف' : 'Meta Description'}
                </label>
                <textarea
                  value={design.seo.description}
                  onChange={(e) =>
                    handleSeoChange('description', e.target.value)
                  }
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your restaurant in 160 characters..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {design.seo.description.length}/160 {isRTL ? 'حرف' : 'characters'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الكلمات المفتاحية' : 'Keywords'}
                </label>
                <input
                  type="text"
                  value={design.seo.keywords}
                  onChange={(e) => handleSeoChange('keywords', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="restaurant, food, delivery, dining"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isRTL ? 'افصل الكلمات بفواصل' : 'Separate keywords with commas'}
                </p>
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {Object.entries(design.socialMedia).map(([platform, url]) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {platform}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      handleSocialChange(platform, e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`https://${platform}.com/yourpage`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Custom Code Tab */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'كود الرأس (Header)' : 'Header Code'}
                </label>
                <textarea
                  value={design.customCode.header}
                  onChange={(e) =>
                    handleCustomCodeChange('header', e.target.value)
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="<!-- Custom header code -->"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isRTL
                    ? 'سيتم إدراج الكود في رأس الصفحة'
                    : 'HTML/JS to inject in page header'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'كود التذييل (Footer)' : 'Footer Code'}
                </label>
                <textarea
                  value={design.customCode.footer}
                  onChange={(e) =>
                    handleCustomCodeChange('footer', e.target.value)
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="<!-- Custom footer code -->"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isRTL
                    ? 'سيتم إدراج الكود في نهاية الصفحة'
                    : 'HTML/JS to inject in page footer'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1 sticky top-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'المعاينة' : 'Preview'}
              </h3>
            </div>

            {/* Preview Content */}
            <div
              className="rounded-lg overflow-hidden border-2"
              style={{
                borderColor: design.colors.primary,
                backgroundColor: design.colors.background,
                color: design.colors.text,
              }}
            >
              <div
                className="p-4 text-white text-center"
                style={{ backgroundColor: design.colors.primary }}
              >
                <h4 className="font-bold">Preview</h4>
              </div>

              <div className="p-4 space-y-3">
                <div
                  className="h-8 rounded"
                  style={{ backgroundColor: design.colors.secondary }}
                />
                <div className="space-y-2">
                  <div
                    className="h-3 rounded w-3/4"
                    style={{ backgroundColor: design.colors.accent }}
                  />
                  <div
                    className="h-3 rounded w-1/2"
                    style={{ backgroundColor: design.colors.accent }}
                  />
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {isRTL ? 'لوحة الألوان' : 'Color Palette'}
              </p>
              <div className="flex gap-2">
                {Object.values(design.colors).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Font Preview */}
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {isRTL ? 'الخطوط' : 'Font Preview'}
              </p>
              <div
                style={{ fontFamily: design.fonts.primary }}
                className="p-2 bg-white dark:bg-gray-700 rounded text-sm text-center"
              >
                Primary: {design.fonts.primary}
              </div>
              <div
                style={{ fontFamily: design.fonts.secondary }}
                className="p-2 bg-white dark:bg-gray-700 rounded text-sm text-center"
              >
                Secondary: {design.fonts.secondary}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => loadDesign()}
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
