import React from 'react';
import { Copyright, SearchCheck } from 'lucide-react';

export default function FooterSEOSection({ landing, setLanding, isRTL }) {
  const handleFooterChange = (key, value) => {
    setLanding(prev => ({
      ...prev,
      footer: { ...prev.footer, [key]: value }
    }));
  };

  const handleSeoChange = (key, value) => {
    setLanding(prev => ({
      ...prev,
      seo: { ...prev.seo, [key]: value }
    }));
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Footer Section */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Copyright className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Footer Content</h3>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={landing.footer.enabled !== false} 
              onChange={(e) => handleFooterChange('enabled', e.target.checked)} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Copyright Text
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({(landing.footer.text || '').length}/500)
              </span>
            </label>
            <textarea
              className="w-full p-3 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
              placeholder="© 2024 Your Restaurant Name. All rights reserved. | Privacy Policy"
              rows="3"
              maxLength={500}
              value={landing.footer.text || ''}
              onChange={(e) => handleFooterChange('text', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This text will appear at the bottom of your landing page.
            </p>
          </div>
        </div>
      </section>

      {/* SEO Section */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SearchCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SEO Settings</h3>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={landing.seo.enabled !== false} 
              onChange={(e) => handleSeoChange('enabled', e.target.checked)} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        </div>
        <div className="space-y-4">
          

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Page Title (Browser Tab)
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({(landing.seo.title || '').length}/60)
              </span>
            </label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="Best Restaurant in Dubai | Fresh & Delicious"
              maxLength={60}
              value={landing.seo.title || ''}
              onChange={(e) => handleSeoChange('title', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Appears in browser tab and search results. Keep it under 60 characters for best results.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Description
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({(landing.seo.description || '').length}/160)
              </span>
            </label>
            <textarea
              className="w-full p-3 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
              placeholder="Discover our authentic cuisine with fresh ingredients and traditional recipes. Visit us for an unforgettable dining experience."
              rows="3"
              maxLength={160}
              value={landing.seo.description || ''}
              onChange={(e) => handleSeoChange('description', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Summary displayed under your page title in search results. Keep it between 120-160 characters.
            </p>
          </div>

         
        </div>
      </section>
    </div>
  );
}
