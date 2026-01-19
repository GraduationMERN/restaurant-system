import React from 'react';
import { Phone } from 'lucide-react';

export default function CallUsSection({ landing, setLanding, isRTL }) {
  const handleCallUsChange = (key, value) => {
    setLanding(prev => ({
      ...prev,
      callUs: { ...prev.callUs, [key]: value }
    }));
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call Us Hotline</h3>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={landing.callUs.enabled !== false} 
              onChange={(e) => handleCallUsChange('enabled', e.target.checked)} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (English)</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="+1 (234) 567-8900"
              value={landing.callUs.number || ''}
              onChange={(e) => handleCallUsChange('number', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف (عربي)</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="(234) 567-8900 +1"
              value={landing.callUs.numberAr || ''}
              onChange={(e) => handleCallUsChange('numberAr', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label/Button Text (English)</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="e.g., 'Call Us', 'Hotline', 'Phone'"
              value={landing.callUs.label || ''}
              onChange={(e) => handleCallUsChange('label', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التسمية (عربي)</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="مثل 'اتصل بنا', 'الخط الساخن'"
              value={landing.callUs.labelAr || ''}
              onChange={(e) => handleCallUsChange('labelAr', e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
