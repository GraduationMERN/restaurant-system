import React from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';

const SECTIONS = [
  { id: 'hero', label: 'Hero Section', },
  { id: 'services', label: 'Services',},
  { id: 'about', label: 'About Section', },
  { id: 'tables', label: ' Table Booking',  },
  { id: 'contact', label: ' Contact & Hours',  },
  { id: 'callus', label: 'Call Us Hotline',  },
  { id: 'testimonials', label: ' Reviews', },
  { id: 'instagram', label: 'Instagram', },
  { id: 'footer', label: ' Footer & SEO', },
];

export default function SettingsSidebar({ activeSection, onSectionChange, unsavedSections = [], isMobileOpen = false, onMobileClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        overflow-y-auto transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
          <button 
            onClick={onMobileClose}
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {SECTIONS.map((section) => {
            const hasUnsaved = unsavedSections.includes(section.id);
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionChange(section.id);
                  onMobileClose?.();
                }}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center justify-between
                  transition-colors duration-200 relative
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span className="flex items-center gap-2 flex-1">
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </span>
                <div className="flex items-center gap-2">
                  {hasUnsaved && (
                    <span className="inline-block w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
                  )}
                  {isActive && <ChevronRight size={18} />}
                </div>
              </button>
            );
          })}
        </nav>

      
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => onMobileClose?.(true)}
        className={`
          lg:hidden fixed bottom-6 right-6 z-20
          p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg
          ${isMobileOpen ? 'hidden' : 'block'}
        `}
      >
        <Menu size={24} />
      </button>
    </>
  );
}
