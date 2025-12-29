import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cog,
  Package,
  CreditCard,
  Palette,
  Zap,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react';

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SettingsExportImport from './SettingsExportImport';

export default function SettingsLayout({
  activeSection: propActiveSection,
  onSectionChange,
  children,
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState(
    propActiveSection || 'system'
  );

  useEffect(() => {
    if (propActiveSection) return;

    // derive active section from URL, default to 'system'
    const path = location.pathname || '';
    const base = '/admin/settings';
    if (path === base || path === `${base}/`) {
      setActiveSection('system');
      return;
    }
    if (path.startsWith(base)) {
      const seg = path.replace(base + '/', '').split('/')[0];
      setActiveSection(seg || 'system');
    }
  }, [location.pathname, propActiveSection]);

  const sections = [
    {
      id: 'system',
      label: i18n.language === 'ar' ? 'الإعدادات العامة' : 'System Settings',
      icon: Cog,
      color: 'bg-blue-500',
    },
    {
      id: 'services',
      label: i18n.language === 'ar' ? 'إعدادات الخدمات' : 'Services',
      icon: Package,
      color: 'bg-green-500',
    },
    {
      id: 'payments',
      label: i18n.language === 'ar' ? 'طرق الدفع' : 'Payment Methods',
      icon: CreditCard,
      color: 'bg-purple-500',
    },
    {
      id: 'branding',
      label: i18n.language === 'ar' ? 'العلامة التجارية' : 'Branding',
      icon: Palette,
      color: 'bg-pink-500',
    },
    {
      id: 'website',
      label: i18n.language === 'ar' ? 'تصميم الموقع' : 'Website Design',
      icon: Palette,
      color: 'bg-indigo-500',
    },
    {
      id: 'integrations',
      label: i18n.language === 'ar' ? 'التكاملات' : 'Integrations',
      icon: Zap,
      color: 'bg-yellow-500',
    },
    {
      id: 'content',
      label: i18n.language === 'ar' ? 'المحتوى' : 'Content',
      icon: FileText,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {i18n.language === 'ar' ? 'إعدادات الدعم' : 'Admin Settings'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {i18n.language === 'ar'
                  ? 'إدارة جميع جوانب متجرك'
                  : 'Manage all aspects of your restaurant'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export/Import Actions */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SettingsExportImport />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar Navigation */}
          <div className={`lg:col-span-1 ${isRTL ? 'lg:order-2' : ''}`}>
            <div className="sticky top-4 space-y-2">
              {/* Desktop Navigation */}
              <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        if (onSectionChange) {
                          onSectionChange(section.id);
                        } else {
                          // navigate to nested route
                          navigate(`/admin/settings/${section.id}`);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-l-blue-600'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      style={
                        isRTL && isActive
                          ? { borderRight: '4px solid rgb(37, 99, 235)' }
                          : {}
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Tab Navigation */}
              <div className="lg:hidden overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          if (onSectionChange) {
                            onSectionChange(section.id);
                          } else {
                            navigate(`/admin/settings/${section.id}`);
                          }
                        }}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className={`lg:col-span-4 ${isRTL ? 'lg:order-1' : ''}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
              {children ? children : <Outlet />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
