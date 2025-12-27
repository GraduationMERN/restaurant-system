// src/features/settings/components/SettingsNav.jsx
export const settingsSections = [
  {
    id: 'general',
    icon: '🏢',
    label: 'Business Settings',
    description: 'Core business information and configuration',
    subItems: [
      { id: 'business-info', label: 'Business Information' },
      { id: 'regional', label: 'Regional & Localization' },
      { id: 'tax-financial', label: 'Tax & Financial' }
    ]
  },
  {
    id: 'branding',
    icon: '🎨',
    label: 'Branding & Design',
    description: 'Customize colors, logo, and visual identity',
    subItems: [
      { id: 'colors-theme', label: 'Colors & Theme' },
      { id: 'logo-assets', label: 'Logo & Assets' },
      { id: 'ui-customization', label: 'UI Customization' }
    ]
  },
  {
    id: 'website',
    icon: '🌐',
    label: 'Website & Content',
    description: 'Landing page, SEO, and content management',
    subItems: [
      { id: 'landing-page', label: 'Landing Page' },
      { id: 'seo-settings', label: 'SEO Settings' },
      { id: 'content-pages', label: 'Content Pages' }
    ]
  },
  {
    id: 'services',
    icon: '🍽️',
    label: 'Services & Operations',
    description: 'Order types, fees, and operational settings',
    subItems: [
      { id: 'order-types', label: 'Order Types' },
      { id: 'fees-surcharges', label: 'Fees & Surcharges' },
      { id: 'policies-agreements', label: 'Policies & Agreements' }
    ]
  },
  {
    id: 'payments',
    icon: '💳',
    label: 'Payments',
    description: 'Payment methods and gateway configuration',
    subItems: [
      { id: 'payment-methods', label: 'Payment Methods' },
      { id: 'gateway-setup', label: 'Gateway Setup' },
      { id: 'payout-settings', label: 'Payout Settings' }
    ]
  },
  {
    id: 'integrations',
    icon: '🔌',
    label: 'Integrations',
    description: 'APIs, webhooks, and third-party services',
    subItems: [
      { id: 'api-webhooks', label: 'API & Webhooks' },
      { id: 'pos-integration', label: 'POS Integration' },
      { id: 'third-party-apps', label: 'Third-party Apps' }
    ]
  },
  {
    id: 'notifications',
    icon: '🔔',
    label: 'Notifications',
    description: 'Email, SMS, and alert settings',
    subItems: [
      { id: 'email-settings', label: 'Email Settings' },
      { id: 'sms-alerts', label: 'SMS Alerts' },
      { id: 'notification-templates', label: 'Templates' }
    ]
  },
  {
    id: 'advanced',
    icon: '⚙️',
    label: 'Advanced',
    description: 'System configuration and security',
    subItems: [
      { id: 'system-config', label: 'System Configuration' },
      { id: 'security', label: 'Security' },
      { id: 'backup-maintenance', label: 'Backup & Maintenance' }
    ]
  }
];