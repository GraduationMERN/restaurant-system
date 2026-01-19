import React from 'react';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';

export default function ContactLocationHoursSection({ landing, setLanding, isRTL }) {
  const handleContactChange = (key, value) => {
    setLanding(prev => ({
      ...prev,
      contact: { ...prev.contact, [key]: value }
    }));
  };

  const handleLocationChange = (key, value) => {
    setLanding(prev => ({
      ...prev,
      location: { ...prev.location, [key]: value }
    }));
  };

  const handleHourChange = (day, key, value) => {
    setLanding(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [key]: value }
      }
    }));
  };

  const toggleAllDays = (enabled) => {
    setLanding(prev => {
      const newHours = {};
      for (let day in prev.hours) {
        newHours[day] = { ...prev.hours[day], enabled };
      }
      return { ...prev, hours: newHours };
    });
  };

  const copyDayToAll = (dayToCopy) => {
    setLanding(prev => {
      const copy = prev.hours[dayToCopy];
      const newHours = {};
      for (let day in prev.hours) {
        newHours[day] = { ...prev.hours[day], open: copy.open, close: copy.close };
      }
      return { ...prev, hours: newHours };
    });
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Contact Info */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={landing.contact.enabled !== false} 
              onChange={(e) => handleContactChange('enabled', e.target.checked)} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              type="email"
              placeholder="contact@restaurant.com"
              value={landing.contact.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (Display)</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="+1 (234) 567-8900"
              value={landing.contact.phone || ''}
              onChange={(e) => handleContactChange('phone', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Location & Address */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location & Address</h3>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={landing.location.enabled !== false} 
              onChange={(e) => handleLocationChange('enabled', e.target.checked)} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address (English)</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="123 Main Street, City"
              value={landing.location.address || ''}
              onChange={(e) => handleLocationChange('address', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الشارع (عربي)</label>
            <input
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="الشارع الرئيسي، المدينة"
              value={landing.location.addressAr || ''}
              onChange={(e) => handleLocationChange('addressAr', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
              <input
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                type="number"
                step="0.0001"
                placeholder="25.2048"
                value={landing.location.latitude || ''}
                onChange={(e) => handleLocationChange('latitude', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                type="number"
                step="0.0001"
                placeholder="55.2708"
                value={landing.location.longitude || ''}
                onChange={(e) => handleLocationChange('longitude', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Opening Hours */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Opening Hours</h3>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={Object.values(landing.hours || {}).every(d => d.enabled)} 
              onChange={(e) => toggleAllDays(e.target.checked)} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enable All</span>
          </label>
        </div>
        <div className="space-y-2">
          {Object.entries(landing.hours || {}).map(([day, data]) => (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
              <label className="w-24 font-medium capitalize text-gray-900 dark:text-white text-sm">
                {day}
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 w-24 text-sm"
                  value={data.open || ''}
                  onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                />
                <span className="text-gray-600 dark:text-gray-400">-</span>
                <input
                  type="time"
                  className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 w-24 text-sm"
                  value={data.close || ''}
                  onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.enabled || false}
                  onChange={(e) => handleHourChange(day, 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Open</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                onClick={() => copyDayToAll(day)}
                title="Copy this time to all days"
              >
                Copy to All
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
