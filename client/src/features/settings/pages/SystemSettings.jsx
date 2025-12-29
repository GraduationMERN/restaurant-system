import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../context/SettingContext';
import { ChevronDown, Save, AlertCircle } from 'lucide-react';

export default function SystemSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { rawSettings, saveSystemCategory, loading: contextLoading } = useSettings();

  useEffect(() => {
    if (rawSettings?.systemSettings) {
      setSettings(rawSettings.systemSettings);
    }
  }, [rawSettings]);

  const handleInputChange = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleToggle = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async (category) => {
    setSaving(true);
    try {
      await saveSystemCategory(category, settings[category] || {});
      setHasChanges(false);
      alert(isRTL ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    {
      id: 'general',
      label: isRTL ? 'إعدادات عامة' : 'General Settings',
      fields: [
        { key: 'restaurantName', label: isRTL ? 'اسم المتجر' : 'Restaurant Name', type: 'text' },
        {
          key: 'restaurantNameAr',
          label: isRTL ? 'اسم المتجر (عربي)' : 'Restaurant Name (Arabic)',
          type: 'text',
        },
        { key: 'description', label: isRTL ? 'الوصف' : 'Description', type: 'textarea' },
        {
          key: 'descriptionAr',
          label: isRTL ? 'الوصف (عربي)' : 'Description (Arabic)',
          type: 'textarea',
        },
        { key: 'phone', label: isRTL ? 'رقم الهاتف' : 'Phone', type: 'tel' },
        { key: 'email', label: isRTL ? 'البريد الإلكتروني' : 'Email', type: 'email' },
      ],
    },
    {
      id: 'location',
      label: isRTL ? 'الموقع' : 'Location',
      fields: [
        { key: 'address', label: isRTL ? 'العنوان' : 'Address', type: 'text' },
        { key: 'addressAr', label: isRTL ? 'العنوان (عربي)' : 'Address (Arabic)', type: 'text' },
        { key: 'city', label: isRTL ? 'المدينة' : 'City', type: 'text' },
        { key: 'country', label: isRTL ? 'الدولة' : 'Country', type: 'text' },
        { key: 'latitude', label: isRTL ? 'خط العرض' : 'Latitude', type: 'number' },
        { key: 'longitude', label: isRTL ? 'خط الطول' : 'Longitude', type: 'number' },
      ],
    },
    {
      id: 'functionality',
      label: isRTL ? 'الميزات' : 'Features',
      fields: [
        { key: 'enableReviews', label: isRTL ? 'تفعيل التقييمات' : 'Enable Reviews', type: 'toggle' },
        {
          key: 'enableRewards',
          label: isRTL ? 'تفعيل نظام المكافآت' : 'Enable Rewards',
          type: 'toggle',
        },
        {
          key: 'enablePromoCode',
          label: isRTL ? 'تفعيل أكواد الخصم' : 'Enable Promo Codes',
          type: 'toggle',
        },
        {
          key: 'enableGuestCheckout',
          label: isRTL ? 'السماح بالشراء بدون حساب' : 'Allow Guest Checkout',
          type: 'toggle',
        },
      ],
    },
    {
      id: 'policies',
      label: isRTL ? 'السياسات' : 'Policies',
      fields: [
        { key: 'minimumOrder', label: isRTL ? 'الحد الأدنى للطلب' : 'Minimum Order Amount', type: 'number' },
        {
          key: 'maximumOrder',
          label: isRTL ? 'الحد الأقصى للطلب' : 'Maximum Order Amount',
          type: 'number',
        },
        {
          key: 'deliveryRadius',
          label: isRTL ? 'نطاق التوصيل (كم)' : 'Delivery Radius (km)',
          type: 'number',
        },
        {
          key: 'estimatedDeliveryTime',
          label: isRTL ? 'وقت التوصيل المتوقع (دقيقة)' : 'Estimated Delivery Time (min)',
          type: 'number',
        },
      ],
    },
  ];

  if (contextLoading) {
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
            ? 'تحديث الإعدادات العامة لمتجرك. جميع التغييرات سيتم حفظها تلقائياً.'
            : 'Update general settings for your restaurant. All changes will be saved automatically.'}
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === category.id ? null : category.id)
              }
              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">{category.label}</h3>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedCategory === category.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedCategory === category.id && (
              <div className="p-6 space-y-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.fields.map((field) => {
                    const value = settings[category.id]?.[field.key] ?? '';

                    if (field.type === 'toggle') {
                      return (
                        <div key={field.key} className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                          </label>
                          <button
                            onClick={() => handleToggle(category.id, field.key, value)}
                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                              value
                                ? 'bg-green-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                value
                                  ? 'translate-x-6 rtl:-translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    }

                    if (field.type === 'textarea') {
                      return (
                        <div key={field.key} className="col-span-1 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                          </label>
                          <textarea
                            value={value}
                            onChange={(e) =>
                              handleInputChange(category.id, field.key, e.target.value)
                            }
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={field.label}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={value}
                          onChange={(e) =>
                            handleInputChange(category.id, field.key, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={field.label}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleSave(category.id)}
                    disabled={!hasChanges || saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : isRTL ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
