import React from 'react';
import { Sliders, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TableBookingSection({ 
  landing, 
  setLanding, 
  isRTL 
}) {
  const { t, i18n } = useTranslation();

  // Initialize tableBooking if it doesn't exist
  const tableBooking = landing.tableBooking || {
    enabled: true,
    showOnLanding: true,
    title: 'Book a Table',
    titleAr: 'احجز طاولة',
    description: 'Reserve a table at our restaurant',
    descriptionAr: 'احجز طاولة في مطعمنا',
    buttonText: 'Book Now',
    buttonTextAr: 'احجز الآن',
  };

  const handleTableBookingChange = (key, value) => {
    setLanding(prev => ({
      ...prev,
      tableBooking: {
        ...prev.tableBooking,
        [key]: value
      }
    }));
  };

  return (
    <section className="space-y-6">
      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-6 h-6 text-blue-600" />
              Table Booking Section
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure how table booking is displayed on your landing page
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={tableBooking.enabled !== false} 
              onChange={(e) => handleTableBookingChange('enabled', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700 dark:text-gray-300">Enable Section</span>
          </label>
        </div>

        {/* Show on Landing Toggle */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={tableBooking.showOnLanding !== false}
              onChange={(e) => handleTableBookingChange('showOnLanding', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Display on Landing Page</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Show table booking prominently on your public landing page</p>
            </div>
          </label>
        </div>

        {/* English Fields */}
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
            English
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section Title
            </label>
            <input 
              type="text" 
              value={tableBooking.title || 'Book a Table'}
              onChange={(e) => handleTableBookingChange('title', e.target.value)}
              placeholder="e.g., Book a Table"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea 
              value={tableBooking.description || 'Reserve a table at our restaurant'}
              onChange={(e) => handleTableBookingChange('description', e.target.value)}
              placeholder="Brief description of table booking service"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Button Text
            </label>
            <input 
              type="text" 
              value={tableBooking.buttonText || 'Book Now'}
              onChange={(e) => handleTableBookingChange('buttonText', e.target.value)}
              placeholder="e.g., Book Now"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Arabic Fields */}
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            العربية
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان القسم
            </label>
            <input 
              type="text" 
              value={tableBooking.titleAr || 'احجز طاولة'}
              onChange={(e) => handleTableBookingChange('titleAr', e.target.value)}
              placeholder="مثال: احجز طاولة"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الوصف
            </label>
            <textarea 
              value={tableBooking.descriptionAr || 'احجز طاولة في مطعمنا'}
              onChange={(e) => handleTableBookingChange('descriptionAr', e.target.value)}
              placeholder="وصف قصير لخدمة الحجز"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نص الزر
            </label>
            <input 
              type="text" 
              value={tableBooking.buttonTextAr || 'احجز الآن'}
              onChange={(e) => handleTableBookingChange('buttonTextAr', e.target.value)}
              placeholder="مثال: احجز الآن"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
   

      {/* Link to Tables Admin */}
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Go to Tables Admin →
        </a>
      </div>
    </section>
  );
}
