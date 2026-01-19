import React from 'react';

export default function AboutSection({ landing, setLanding, handleUploadToTarget, isRTL }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">About Section</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tell your customers your story
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <input 
            type="checkbox" 
            checked={landing.about.enabled !== false} 
            onChange={(e)=>setLanding(l=>({
              ...l, 
              about: {
                ...l.about, 
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
              About Title (English)
            </label>
            <input
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Our Story"
              value={landing.about.title || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                about: { 
                  ...l.about, 
                  title: e.target.value 
                } 
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              About Content (English)
            </label>
            <textarea
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your restaurant's unique story and values..."
              rows="4"
              value={landing.about.content || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                about: { 
                  ...l.about, 
                  content: e.target.value 
                } 
              }))}
            />
          </div>
        </div>

        {/* Arabic Fields */}
        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان حول (عربي)
            </label>
            <input
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="قصتنا"
              value={landing.about.titleAr || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                about: { 
                  ...l.about, 
                  titleAr: e.target.value 
                } 
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              محتوى حول (عربي)
            </label>
            <textarea
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="شارك قصة مطعمك الفريدة وقيمك..."
              rows="4"
              value={landing.about.contentAr || ''}
              onChange={(e) => setLanding(l => ({ 
                ...l, 
                about: { 
                  ...l.about, 
                  contentAr: e.target.value 
                } 
              }))}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            About Image
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Image URL (https://...)"
                value={landing.about.image || ''}
                onChange={(e) => setLanding(l => ({ ...l, about: { ...l.about, image: e.target.value } }))}
                className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
              <div>
                <input type="file" accept="image/*" onChange={async (e)=>{ const f = e.target.files && e.target.files[0]; if (f) await handleUploadToTarget(f, 'landing.about.image'); }} className="text-sm w-full" />
              </div>
            </div>
            {landing.about.image && <img src={landing.about.image} alt="about" className="h-16 object-contain rounded border border-gray-300 dark:border-gray-600" />}
          </div>
        </div>
      </div>
    </section>
  );
}
