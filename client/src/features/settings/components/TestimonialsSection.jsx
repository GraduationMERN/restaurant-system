import React from 'react';
import { Star, MessageSquare, Trash2, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function TestimonialsSection({ landing, setLanding, isRTL, generateUniqueId }) {
  const reviewsState = useSelector(state => state.reviews);

  const handleTestimonialAdd = () => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: [...(prev.testimonials.items || []), { 
          id: generateUniqueId(),
          name: '', 
          content: '', 
          rating: 5,
          image: '' 
        }],
      },
    }));
  };

  const handleTestimonialRemove = (idx) => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: (prev.testimonials.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  const handleTestimonialChange = (idx, key, value) => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: (prev.testimonials.items || []).map((t, i) =>
          i === idx ? { ...t, [key]: value } : t
        ),
      },
    }));
  };

  const toggleFeaturedReview = (reviewId) => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        featuredIds: (prev.testimonials.featuredIds || []).includes(reviewId)
          ? (prev.testimonials.featuredIds || []).filter(id => id !== reviewId)
          : [...(prev.testimonials.featuredIds || []), reviewId]
      }
    }));
  };

  const setTestimonialsMode = (mode) => {
    setLanding(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        mode
      }
    }));
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Testimonials & Reviews</h3>
          </div>
          <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <input 
              type="checkbox" 
              checked={landing.testimonials.enabled !== false} 
              onChange={(e) => setLanding(prev => ({
                ...prev, 
                testimonials: {
                  ...prev.testimonials, 
                  enabled: e.target.checked
                }
              }))} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section Title (English)</label>
              <input
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                placeholder="What Our Customers Say"
                value={landing.testimonials.title || ''}
                onChange={(e) => setLanding(l => ({ 
                  ...l, 
                  testimonials: { 
                    ...l.testimonials, 
                    title: e.target.value 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان القسم (عربي)</label>
              <input
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                placeholder="آراء عملائنا"
                value={landing.testimonials.titleAr || ''}
                onChange={(e) => setLanding(l => ({ 
                  ...l, 
                  testimonials: { 
                    ...l.testimonials, 
                    titleAr: e.target.value 
                  } 
                }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Display Mode */}
      <section className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
        <label className="text-sm font-medium text-gray-900 dark:text-white block mb-3">Display Mode:</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="reviewsMode" 
              checked={(landing.testimonials.mode || 'all') === 'all'} 
              onChange={() => setTestimonialsMode('all')} 
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show All Reviews</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="reviewsMode" 
              checked={(landing.testimonials.mode || 'all') === 'selected'} 
              onChange={() => setTestimonialsMode('selected')} 
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Select Specific Reviews</span>
          </label>
        </div>
      </section>

      {/* Featured Reviews from System */}
      {(landing.testimonials.mode || 'all') === 'selected' && (
        <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Select Featured Reviews ({(reviewsState?.list || []).length})</h4>
          {reviewsState?.loading && <div className="text-sm text-gray-600 dark:text-gray-400 py-4">Loading reviews...</div>}
          {(reviewsState?.list || []).length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(reviewsState?.list || []).slice(0, 50).map(r => (
                <label key={r._id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={(landing.testimonials.featuredIds || []).includes(r._id)} 
                    onChange={() => toggleFeaturedReview(r._id)} 
                    className="w-4 h-4 mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{r.name || r.userName || 'Reviewer'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {r.comment || r.content || 'No comment'}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-yellow-500 flex-shrink-0 whitespace-nowrap">
                    {Array.from({length: (r.rating || 5)}).map((_,k)=>("★")).join('')}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 py-4">No reviews available yet.</div>
          )}
        </section>
      )}

      {/* Manual Testimonials */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Manual Testimonials</h4>
        <div className="space-y-4">
          {(landing.testimonials.items || []).map((item, idx) => (
            <div key={item.id || idx} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                  <input
                    className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    placeholder="Customer Name"
                    value={item.name || ''}
                    onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rating</label>
                  <select
                    className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    value={item.rating || 5}
                    onChange={(e) => handleTestimonialChange(idx, 'rating', parseInt(e.target.value))}
                  >
                    {[1,2,3,4,5].map(r => (
                      <option key={r} value={r}>{r} ★</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Testimonial Text</label>
                <textarea
                  className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="What did they love about your restaurant?"
                  rows="3"
                  value={item.content || ''}
                  onChange={(e) => handleTestimonialChange(idx, 'content', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image URL</label>
                <input
                  className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="https://..."
                  value={item.image || ''}
                  onChange={(e) => handleTestimonialChange(idx, 'image', e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button 
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors flex items-center gap-2"
                  onClick={() => handleTestimonialRemove(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button 
            className="w-full p-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={handleTestimonialAdd}
          >
            <Plus className="w-5 h-5" />
            Add Testimonial
          </button>
        </div>
      </section>
    </div>
  );
}
