// src/pages/admin/Settings.jsx
import { useState } from 'react';
import SettingsLayout from '../../features/settings/components/SettingsLayout';
import GeneralSettings from '../../features/settings/pages/GeneralSettings';
import BrandingSettings from '../../features/settings/pages/BrandingSettings';
import WebsiteSettings from '../../features/settings/pages/WebsiteSettings';
import ServicesSettings from '../../features/settings/pages/ServicesSettings';
import NotificationsSettings from '../../features/settings/pages/NotificationsSettings';
// Add other imports as you create them

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');

  const renderSection = () => {
    switch (activeSection) {
      case 'system':
        return <GeneralSettings />;
      case 'branding':
        return <BrandingSettings />;
      case 'website':
        return <WebsiteSettings />;
      case 'services':
        return <ServicesSettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'payments':
        return <div>Payments Settings - Coming Soon</div>;
      case 'integrations':
        return <div>Integrations Settings - Coming Soon</div>;
      case 'advanced':
        return <div>Advanced Settings - Coming Soon</div>;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <SettingsLayout activeSection={activeSection}>
      {renderSection()}
    </SettingsLayout>
  );
}