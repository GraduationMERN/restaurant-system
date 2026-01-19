import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsAPI } from '../hooks/useSettingsAPI';
import { Save, AlertCircle, Clock, Info, CheckCircle } from 'lucide-react';

export default function ServiceSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { getServices, updateServices } = useSettingsAPI();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const data = await getServices();
    console.log('=== LOAD SERVICES IN COMPONENT ===');
    console.log('Received data:', JSON.stringify(data, null, 2));
    if (data) {
      setServices(data);
      console.log('✅ Services loaded:', JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️ getServices returned null or undefined');
    }
    setLoading(false);
  };

  const handleToggle = (serviceKey) => {
    setServices((prev) => {
      const prevService = prev[serviceKey] || {};
      return {
        ...prev,
        [serviceKey]: {
          ...prevService,
          enabled: !prevService.enabled,
        },
      };
    });
    setHasChanges(true);
  };

  const handleFieldChange = (serviceKey, field, value) => {
    setServices((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('=== SERVICE SETTINGS SAVE ===');
    console.log('Services to save:', JSON.stringify(services, null, 2));
    const success = await updateServices(services);
    if (success) {
      console.log('✅ Services saved successfully');
      setHasChanges(false);
    } else {
      console.log('❌ Failed to save services');
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

  const serviceConfigs = [
    {
      id: 'pickup',
      label: isRTL ? 'الاستلام من المتجر' : 'Pickup Service',
      description: isRTL ? 'السماح للعملاء باستلام الطلبات من المتجر' : 'Allow customers to pick up orders',
      fields: [
        {
          key: 'pickupTime',
          label: isRTL ? 'وقت الاستلام المتوقع (دقيقة)' : 'Estimated Pickup Time (minutes)',
          type: 'number',
        },
      ],
    },
    {
      id: 'delivery',
      label: isRTL ? 'خدمة التوصيل' : 'Delivery Service',
      description: isRTL ? 'السماح بتوصيل الطلبات للعملاء' : 'Allow order delivery to customers',
      fields: [
        {
          key: 'deliveryTime',
          label: isRTL ? 'وقت التوصيل المتوقع (دقيقة)' : 'Estimated Delivery Time (minutes)',
          type: 'number',
        },
        {
          key: 'deliveryFee',
          label: isRTL ? 'رسوم التوصيل' : 'Delivery Fee',
          type: 'number',
        },
       
      ],
    },
    {
      id: 'dineIn',
      label: isRTL ? 'تناول الطعام في المتجر' : 'Dine-In Service',
      description: isRTL ? 'السماح للعملاء بتناول الطعام في المتجر' : 'Allow customers to dine at your location',
      fields: [
        {
          key: 'dineInTime',
          label: isRTL ? 'الوقت المتوقع (دقيقة)' : 'Estimated Time (minutes)',
          type: 'number',
        },
        {
          key: 'tableCapacity',
          label: isRTL ? 'سعة الطاولات' : 'Total Table Capacity',
          type: 'number',
        },
      ],
    },
    {
      id: 'tableBookings',
      label: isRTL ? 'حجز الطاولات' : 'Table Booking',
      description: isRTL ? 'السماح بحجز الطاولات مسبقاً' : 'Allow advance table reservations',
      fields: [
        {
          key: 'bookingAdvanceTime',
          label: isRTL ? 'وقت الحجز المسموح به (ساعة)' : 'Advance Booking Time (hours)',
          type: 'number',
        },
        {
          key: 'minPartySize',
          label: isRTL ? 'الحد الأدنى لعدد الأشخاص' : 'Minimum Party Size',
          type: 'number',
        },
        {
          key: 'maxPartySize',
          label: isRTL ? 'الحد الأقصى لعدد الأشخاص' : 'Maximum Party Size',
          type: 'number',
        },
      ],
      
    },
    
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-m text-black-800 dark:text-white-300">
          {isRTL
            ? 'تفعيل أو تعطيل الخدمات وتعديل إعداداتها حسب احتياجاتك'
            : 'Enable or disable services and configure their settings'}
        </p>
      </div>

    

      <div className="space-y-4">
        {serviceConfigs.map((service) => {
          const serviceData = services[service.id] || { enabled: false };

          return (
            <div
              key={service.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {service.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {service.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggle(service.id)}
                    className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ml-4 flex-shrink-0 ${
                      serviceData.enabled
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        serviceData.enabled
                          ? 'translate-x-6 rtl:-translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {serviceData.enabled && service.fields.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {service.fields.map((field) => {
                      const value = serviceData[field.key] ?? '';

                      return (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                          </label>
                          <div className="flex items-center">
                            {field.key.includes('Time') && (
                              <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            )}
                            <input
                              type={field.type}
                              value={value}
                              onChange={(e) =>
                                handleFieldChange(service.id, field.key, e.target.value)
                              }
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Link to Tables Admin - Show after tableBookings section */}
        {serviceConfigs.find(s => s.id === 'tableBookings') && services.tableBookings?.enabled && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Manage Tables</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure tables, hours, and booking settings</p>
              </div>
            </div>
            <a 
              href="/admin/tables"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Go to Tables Admin →
            </a>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => loadServices()}
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
