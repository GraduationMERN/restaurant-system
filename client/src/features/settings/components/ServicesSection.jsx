import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function ServicesSection({ 
  landing, 
  setLanding, 
  handleUploadToTarget, 
  generateUniqueId, 
  reorderArray, 
  isRTL 
}) {
  const handleAddService = () => {
    setLanding(prev => ({
      ...prev,
      services: {
        ...prev.services,
        items: [...(prev.services.items || []), {
          id: generateUniqueId(),
          title: 'New Service',
          titleAr: 'خدمة جديدة',
          description: 'Service description',
          descriptionAr: 'وصف الخدمة',
          image: '',
          navigate: '/',
          enabled: true
        }]
      }
    }));
  };

  const handleRemoveService = (serviceId) => {
    setLanding(prev => ({
      ...prev,
      services: {
        ...prev.services,
        items: (prev.services.items || []).filter(service => service.id !== serviceId)
      }
    }));
  };

  const handleServiceChange = (serviceId, key, value) => {
    setLanding(prev => ({
      ...prev,
      services: {
        ...prev.services,
        items: (prev.services.items || []).map(service => 
          service.id === serviceId ? { ...service, [key]: value } : service
        )
      }
    }));
  };

  return (
    <section className="space-y-6">
      {/* Services Card Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Service Cards</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Display your services as clickable cards
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={landing.services.enabled !== false} 
              onChange={(e)=>setLanding(l=>({
                ...l, 
                services: {
                  ...l.services, 
                  enabled: e.target.checked
                }
              }))} 
              className="w-4 h-4"
            />
            <span className="text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        </div>

        <div className="space-y-4">
          {(landing.services.items || []).map((service, idx) => (
            <div key={service.id || idx} className="border rounded-lg p-4 sm:p-5 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Service Title (English)"
                  value={service.title || ''}
                  onChange={(e) => handleServiceChange(service.id, 'title', e.target.value)}
                />
                <input
                  className="p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Service Title (Arabic)"
                  value={service.titleAr || ''}
                  onChange={(e) => handleServiceChange(service.id, 'titleAr', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Description (English)"
                  value={service.description || ''}
                  onChange={(e) => handleServiceChange(service.id, 'description', e.target.value)}
                />
                <input
                  className="p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Description (Arabic)"
                  value={service.descriptionAr || ''}
                  onChange={(e) => handleServiceChange(service.id, 'descriptionAr', e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Image URL or Upload:</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Image URL (e.g., https://...)"
                    value={service.image || ''}
                    onChange={(e) => handleServiceChange(service.id, 'image', e.target.value)}
                    className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="flex-1 text-xs text-gray-600 dark:text-gray-400">
                      Or upload image:
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => { 
                          const f = e.target.files && e.target.files[0]; 
                          if (f) await handleUploadToTarget(f, `landing.services.items[${landing.services.items.findIndex(s => s.id === service.id)}].image`); 
                        }} 
                        className="text-sm w-full mt-1" 
                      />
                    </label>
                    {service.image && <img src={service.image} alt="service" className="h-10 object-contain rounded" />}
                  </div>
                </div>
              </div>

              <input
                className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="Navigation Link (e.g., /menu)"
                value={service.navigate || ''}
                onChange={(e) => handleServiceChange(service.id, 'navigate', e.target.value)}
              />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.enabled !== false}
                    onChange={(e) => handleServiceChange(service.id, 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded" onClick={()=>reorderArray('services.items', idx, idx-1)} title="Move Up">
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded" onClick={()=>reorderArray('services.items', idx, idx+1)} title="Move Down">
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => handleRemoveService(service.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button
            className="w-full p-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={handleAddService}
          >
            <Plus size={20} /> Add Service Card
          </button>
        </div>
      </div>

     
    </section>
  );
}
