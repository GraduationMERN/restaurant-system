// src/pages/admin/Settings.jsx
import { useState } from 'react';
import SettingsLayout from '../../features/settings/components/SettingsLayout';
import ServiceSettings from '../../features/settings/pages/ServiceSettings';
import PaymentMethodsSettings from '../../features/settings/pages/PaymentMethodsSettings';
import WebsiteDesignSettings from '../../features/settings/pages/WebsiteDesignSettings';
import IntegrationsSettings from '../../features/settings/pages/IntegrationsSettings';
import BrandingSettings from '../../features/settings/pages/BrandingSettings';
import ContentSettings from '../../features/settings/pages/ContentSettings';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('landing');

  const renderSection = () => {
    switch (activeSection) {
      
      case 'services':
        return <ServiceSettings />;
      case 'payments':
        return <PaymentMethodsSettings />;
      case 'website':
        return <WebsiteDesignSettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      case 'branding':
        return <BrandingSettings />;
      case 'landing':
        return <LandingSettings />;
      case 'content':
        return <ContentSettings />;
      default:
        return <LandingSettings />;
    }
  };

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderSection()}
    </SettingsLayout>
  );
}