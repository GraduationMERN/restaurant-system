import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsAPI } from '../hooks/useSettingsAPI';
import { Save, AlertCircle, Zap } from 'lucide-react';

export default function IntegrationsSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { getIntegrations, updateIntegration, toggleIntegration } =
    useSettingsAPI();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    const data = await getIntegrations();
    if (data) {
      setIntegrations(data);
    }
    setLoading(false);
  };

  const handleToggle = async (integrationKey) => {
    const current = integrations[integrationKey];
    const newEnabled = !current.enabled;
    
    const success = await toggleIntegration(
      integrationKey,
      newEnabled
    );
    if (success) {
      await loadIntegrations();
    }
  };

  const handleFieldChange = (integrationKey, field, value) => {
    setIntegrations((prev) => ({
      ...prev,
      [integrationKey]: {
        ...prev[integrationKey],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async (integrationKey) => {
    setSaving(true);
    const success = await updateIntegration(
      integrationKey,
      integrations[integrationKey]
    );
    if (success) {
      setHasChanges(false);
      await loadIntegrations();
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

  const integrationConfigs = [
    {
      id: 'facebookPixel',
      label: isRTL ? 'Facebook Pixel' : 'Facebook Pixel',
      description: isRTL
        ? 'تتبع حركة العملاء والتحويلات'
        : 'Track customer behavior and conversions',
      icon: '👍',
      fields: [
        {
          key: 'pixelId',
          label: isRTL ? 'معرف Pixel' : 'Pixel ID',
          type: 'text',
          placeholder: '123456789',
        },
      ],
    },
    {
      id: 'googleAnalytics',
      label: isRTL ? 'Google Analytics' : 'Google Analytics',
      description: isRTL
        ? 'تحليل الزوار والمبيعات'
        : 'Analyze visitor behavior and sales',
      icon: '📊',
      fields: [
        {
          key: 'trackingId',
          label: isRTL ? 'معرف التتبع' : 'Tracking ID',
          type: 'text',
          placeholder: 'G-XXXXXXXXXX',
        },
      ],
    },
    {
      id: 'googleTagManager',
      label: isRTL ? 'Google Tag Manager' : 'Google Tag Manager',
      description: isRTL
        ? 'إدارة العلامات والتحليلات'
        : 'Manage tags and analytics',
      icon: '🏷️',
      fields: [
        {
          key: 'containerId',
          label: isRTL ? 'معرف الحاوية' : 'Container ID',
          type: 'text',
          placeholder: 'GTM-XXXXXX',
        },
      ],
    },
    {
      id: 'mailchimp',
      label: isRTL ? 'Mailchimp' : 'Mailchimp',
      description: isRTL
        ? 'إدارة قوائم البريد الإلكتروني'
        : 'Manage email marketing lists',
      icon: '📧',
      fields: [
        {
          key: 'apiKey',
          label: isRTL ? 'مفتاح API' : 'API Key',
          type: 'password',
          placeholder: 'your-api-key-here',
        },
        {
          key: 'audience',
          label: isRTL ? 'معرف الجمهور' : 'Audience ID',
          type: 'text',
          placeholder: 'audience-id',
        },
      ],
    },
    {
      id: 'stripe',
      label: isRTL ? 'Stripe' : 'Stripe',
      description: isRTL
        ? 'معالجة الدفع عبر البطاقات'
        : 'Credit card payment processing',
      icon: '💳',
      fields: [
        {
          key: 'publishableKey',
          label: isRTL ? 'مفتاح النشر' : 'Publishable Key',
          type: 'password',
          placeholder: 'pk_live_...',
        },
        {
          key: 'secretKey',
          label: isRTL ? 'المفتاح السري' : 'Secret Key',
          type: 'password',
          placeholder: 'sk_live_...',
        },
      ],
    },
    {
      id: 'twilio',
      label: isRTL ? 'Twilio' : 'Twilio',
      description: isRTL
        ? 'إرسال رسائل SMS والإشعارات'
        : 'Send SMS and notifications',
      icon: '📱',
      fields: [
        {
          key: 'accountSid',
          label: isRTL ? 'معرف الحساب' : 'Account SID',
          type: 'password',
          placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          key: 'authToken',
          label: isRTL ? 'رمز المصادقة' : 'Auth Token',
          type: 'password',
          placeholder: 'your-auth-token',
        },
        {
          key: 'phoneNumber',
          label: isRTL ? 'رقم الهاتف' : 'Phone Number',
          type: 'tel',
          placeholder: '+1234567890',
        },
      ],
    },
    {
      id: 'sendgrid',
      label: isRTL ? 'SendGrid' : 'SendGrid',
      description: isRTL
        ? 'خدمة البريد الإلكتروني'
        : 'Email delivery service',
      icon: '✉️',
      fields: [
        {
          key: 'apiKey',
          label: isRTL ? 'مفتاح API' : 'API Key',
          type: 'password',
          placeholder: 'SG.your-api-key',
        },
        {
          key: 'senderEmail',
          label: isRTL ? 'بريد المرسل' : 'Sender Email',
          type: 'email',
          placeholder: 'noreply@example.com',
        },
      ],
    },
    {
      id: 'slack',
      label: isRTL ? 'Slack' : 'Slack',
      description: isRTL
        ? 'إشعارات الأوامر والتنبيهات'
        : 'Order notifications and alerts',
      icon: '💬',
      fields: [
        {
          key: 'webhookUrl',
          label: isRTL ? 'عنوان Webhook' : 'Webhook URL',
          type: 'url',
          placeholder: 'https://hooks.slack.com/services/...',
        },
        {
          key: 'channel',
          label: isRTL ? 'اسم القناة' : 'Channel Name',
          type: 'text',
          placeholder: '#orders',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {isRTL
            ? 'ربط التطبيقات والخدمات الخارجية. تفعيل التكاملات لتحسين تجربة متجرك.'
            : 'Connect external services and applications to enhance your restaurant'}
        </p>
      </div>

      <div className="space-y-4">
        {integrationConfigs.map((integration) => {
          const integrationData = integrations[integration.id] || {
            enabled: false,
          };

          return (
            <div
              key={integration.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {integration.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(integration.id)}
                    className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ml-4 flex-shrink-0 ${
                      integrationData.enabled
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        integrationData.enabled
                          ? 'translate-x-6 rtl:-translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {integrationData.enabled && integration.fields.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
                  {integration.fields.map((field) => {
                    const value = integrationData[field.key] ?? '';

                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.label}
                        </label>
                        {field.type === 'password' ? (
                          <input
                            type="password"
                            value={value}
                            onChange={(e) =>
                              handleFieldChange(
                                integration.id,
                                field.key,
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={field.placeholder}
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={value}
                            onChange={(e) =>
                              handleFieldChange(
                                integration.id,
                                field.key,
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => loadIntegrations()}
                      disabled={!hasChanges}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => handleSave(integration.id)}
                      disabled={!hasChanges || saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving
                        ? isRTL
                          ? 'جاري الحفظ...'
                          : 'Saving...'
                        : isRTL
                        ? 'حفظ'
                        : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
