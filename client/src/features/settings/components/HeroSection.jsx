import React from 'react';

export default function HeroSection({ landing, setLanding, handleUploadToTarget, isRTL }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Section</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Main headline and background for your landing page
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <input 
            type="checkbox" 
            checked={landing.hero.enabled !== false} 
            onChange={(e)=>setLanding(l=>({
              ...l, 
              hero: {
                ...l.hero, 
                enabled: e.target.checked
              }
            }))} 
            className="w-4 h-4"
          />
          <span className="text-gray-700 dark:text-gray-300">Enabled</span>
        </label>
      </div>

      <div className="space-y-4">
        {/* English Fields */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hero Title (English)
            </label>
            <input
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Welcome to your restaurant"
              value={landing.hero.title || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                hero: { 
                  ...l.hero, 
                  title: e.target.value 
                } 
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hero Subtitle (English)
            </label>
            <textarea
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Discover authentic flavors..."
              rows="2"
              value={landing.hero.subtitle || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                hero: { 
                  ...l.hero, 
                  subtitle: e.target.value 
                } 
              }))}
            />
          </div>
        </div>

        {/* Arabic Fields */}
        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              العنوان الأساسي (عربي)
            </label>
            <input
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أهلا بك في مطعمنا"
              value={landing.hero.titleAr || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                hero: { 
                  ...l.hero, 
                  titleAr: e.target.value 
                } 
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              العنوان الفرعي (عربي)
            </label>
            <textarea
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="اكتشف النكهات الأصيلة..."
              rows="2"
              value={landing.hero.subtitleAr || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                hero: { 
                  ...l.hero, 
                  subtitleAr: e.target.value 
                } 
              }))}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hero Background Image
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Image URL (https://...)"
                value={landing.hero.image || ''}
                onChange={(e) => setLanding(l => ({ ...l, hero: { ...l.hero, image: e.target.value } }))}
                className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
              <div>
                <input type="file" accept="image/*" onChange={async (e)=>{ const f = e.target.files && e.target.files[0]; if (f) await handleUploadToTarget(f, 'landing.hero.image'); }} className="text-sm w-full" />
              </div>
            </div>
            {landing.hero.image && <img src={landing.hero.image} alt="hero" className="h-16 object-contain rounded border border-gray-300 dark:border-gray-600" />}
          </div>
        </div>

        {/* Colors */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Colors
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Background:</span>
              <input type="color" value={landing.hero.bgColor || '#ffffff'} onChange={(e)=>setLanding(l=>({...l, hero:{...l.hero, bgColor: e.target.value}}))} className="h-10 w-16 cursor-pointer rounded" />
            </label>
            <label className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Text:</span>
              <input type="color" value={landing.hero.textColor || '#000000'} onChange={(e)=>setLanding(l=>({...l, hero:{...l.hero, textColor: e.target.value}}))} className="h-10 w-16 cursor-pointer rounded" />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
