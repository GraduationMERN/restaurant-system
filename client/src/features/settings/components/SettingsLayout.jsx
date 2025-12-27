// src/features/settings/components/SettingsLayout.jsx
import { settingsSections } from './SettingsNav';
export default function SettingsLayout({ children, activeSection }) {
  return (
    <div className="flex min-h-screen">
      {/* Settings Navigation Sidebar */}
      <div className="w-64 border-r bg-white dark:bg-gray-900 p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold">White Label Settings</h1>
          <p className="text-sm text-gray-500">Configure your restaurant system</p>
        </div>
        
        <nav className="space-y-1">
          {settingsSections.map((section) => (
            <div key={section.id} className="mb-2">
              <div className={`px-3 py-2 rounded-lg flex items-center gap-3 ${
                activeSection === section.id 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
                <span className="text-lg">{section.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{section.label}</div>
                  <div className="text-xs text-gray-500">{section.description}</div>
                </div>
              </div>
              
              {/* Sub-items */}
              {section.subItems && (
                <div className="ml-8 mt-1 space-y-1">
                  {section.subItems.map((subItem) => (
                    <a
                      key={subItem.id}
                      href={`/settings/${section.id}#${subItem.id}`}
                      className="block px-3 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {subItem.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}