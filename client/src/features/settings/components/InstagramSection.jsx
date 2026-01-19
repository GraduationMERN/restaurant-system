import React, { useState } from 'react';
import { Instagram, Trash2, Plus, Eye, Heart, MessageCircle } from 'lucide-react';

export default function InstagramSection({ landing, setLanding, isRTL, generateUniqueId }) {
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importPreviewPosts, setImportPreviewPosts] = useState([]);
  const [importMode, setImportMode] = useState('merge');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleInstagramChange = (postId, key, value) => {
    setLanding(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        posts: (prev.instagram.posts || []).map(post =>
          post.id === postId ? { ...post, [key]: value } : post
        )
      }
    }));
  };

  const handleAddInstagramPost = () => {
    setLanding(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        posts: [...(prev.instagram.posts || []), {
          id: generateUniqueId(),
          image: '',
          caption: '',
          likes: '',
          comments: '',
          date: '',
          tags: []
        }]
      }
    }));
  };

  const handleRemoveInstagramPost = (postId) => {
    setLanding(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        posts: (prev.instagram.posts || []).filter(p => p.id !== postId)
      }
    }));
  };

  const reorderArray = (arrayPath, fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= (landing.instagram.posts || []).length) return;
    setLanding(prev => {
      const arr = [...(prev.instagram.posts || [])];
      [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
      return {
        ...prev,
        instagram: { ...prev.instagram, posts: arr }
      };
    });
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Import Modal */}
      {showImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowImportConfirm(false); setImportPreviewPosts([]); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 z-10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Preview Instagram Import</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Previewing {importPreviewPosts.length} posts. Choose how to apply:
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="importMode" 
                  checked={importMode === 'merge'} 
                  onChange={() => setImportMode('merge')} 
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Merge with existing posts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="importMode" 
                  checked={importMode === 'replace'} 
                  onChange={() => setImportMode('replace')} 
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Replace existing posts</span>
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4 max-h-60 overflow-auto">
              {importPreviewPosts.slice(0, 24).map((p, i) => (
                <div key={i} className="rounded overflow-hidden bg-gray-100 dark:bg-gray-700 h-28 flex items-center justify-center">
                  {p.image ? (
                    <img src={p.image} alt={p.caption || 'post'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs text-gray-500 p-2 text-center">No image</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => { setShowImportConfirm(false); setImportPreviewPosts([]); }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
                onClick={() => {
                  // Apply import
                  if (importMode === 'replace') {
                    setLanding(prev => ({
                      ...prev,
                      instagram: { ...prev.instagram, posts: importPreviewPosts, enabled: true }
                    }));
                  } else {
                    // Merge: combine with existing
                    const existing = landing.instagram?.posts || [];
                    const merged = [...existing];
                    importPreviewPosts.forEach(newPost => {
                      if (!merged.find(p => p.id === newPost.id)) {
                        merged.push(newPost);
                      }
                    });
                    setLanding(prev => ({
                      ...prev,
                      instagram: { ...prev.instagram, posts: merged, enabled: true }
                    }));
                  }
                  setShowImportConfirm(false);
                  setImportPreviewPosts([]);
                }}
                disabled={saving}
              >
                {saving ? 'Applying...' : 'Apply Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Import */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Instagram Posts</h3>
            <label className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <input 
                type="checkbox" 
                checked={landing.instagram.enabled !== false} 
                onChange={(e) => setLanding(prev => ({
                  ...prev, 
                  instagram: {
                    ...prev.instagram, 
                    enabled: e.target.checked
                  }
                }))} 
              />
              <span className="text-gray-700 dark:text-gray-300">Enabled</span>
            </label>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              placeholder="@username"
              className="flex-1 sm:flex-initial p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
              defaultValue=""
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const username = e.target.value.trim();
                  if (!username) {
                    setError('Enter Instagram username');
                    return;
                  }
                  // Simulate preview (in real app, this would call API)
                  setImportPreviewPosts([]);
                  setImportMode('merge');
                  setShowImportConfirm(true);
                }
              }}
            />
            <button
              className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded text-sm whitespace-nowrap"
              onClick={(e) => {
                const input = e.target.parentElement?.querySelector('input');
                const username = input?.value.trim();
                if (!username) {
                  setError('Enter Instagram username');
                  return;
                }
                // Simulate preview
                setImportPreviewPosts([]);
                setImportMode('merge');
                setShowImportConfirm(true);
              }}
            >
              Preview
            </button>
          </div>
        </div>
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded text-sm">
            {error}
          </div>
        )}
      </section>

      {/* Posts List */}
      <section className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Posts ({(landing.instagram.posts || []).length})</h4>
        <div className="space-y-4">
          {(landing.instagram.posts || []).map((post, idx) => (
            <div key={post.id || idx} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image URL</label>
                <input
                  className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="https://..."
                  value={post.image || ''}
                  onChange={(e) => handleInstagramChange(post.id, 'image', e.target.value)}
                />
              </div>
              {post.image && (
                <div className="relative w-full h-40 rounded overflow-hidden">
                  <img src={post.image} alt="post" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Caption</label>
                <textarea
                  className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Post caption / description"
                  rows="2"
                  value={post.caption || ''}
                  onChange={(e) => handleInstagramChange(post.id, 'caption', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Likes</label>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <input
                      className="flex-1 p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      placeholder="1,234"
                      value={post.likes || ''}
                      onChange={(e) => handleInstagramChange(post.id, 'likes', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Comments</label>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <input
                      className="flex-1 p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      placeholder="45"
                      value={post.comments || ''}
                      onChange={(e) => handleInstagramChange(post.id, 'comments', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
                  <input
                    className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    placeholder="2 days ago"
                    value={post.date || ''}
                    onChange={(e) => handleInstagramChange(post.id, 'date', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tags (comma separated)</label>
                <input
                  className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="#food, #restaurant, #delicious"
                  value={(post.tags || []).join(', ')}
                  onChange={(e) => handleInstagramChange(post.id, 'tags', e.target.value.split(',').map(t => t.trim()))}
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-sm font-medium"
                    title="Move Up" 
                    onClick={() => reorderArray('instagram.posts', idx, idx - 1)}
                  >
                    ↑
                  </button>
                  <button 
                    type="button" 
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-sm font-medium"
                    title="Move Down" 
                    onClick={() => reorderArray('instagram.posts', idx, idx + 1)}
                  >
                    ↓
                  </button>
                </div>
                <button 
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors flex items-center gap-2"
                  onClick={() => handleRemoveInstagramPost(post.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button 
            className="w-full p-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={handleAddInstagramPost}
          >
            <Plus className="w-5 h-5" />
            Add Post
          </button>
        </div>
      </section>
    </div>
  );
}
