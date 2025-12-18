import React, { useEffect, useState } from "react";
import api from "../../api/axios";

export default function InstagramAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ image: "", link: "", caption: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/api/admin/instagram-posts");
        setPosts(res?.data?.data || res?.data || []);
      } catch (e) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/admin/instagram-posts", form);
      setPosts((p) => [res.data.data, ...p]);
      setForm({ image: "", link: "", caption: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/api/admin/instagram-posts/${id}`);
      setPosts((p) => p.filter((x) => x._id !== id && x.id !== id));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Instagram Posts (Admin)</h2>
      <form onSubmit={handleCreate} className="flex gap-2">
        <input placeholder="Image URL" value={form.image} onChange={(e)=>setForm(f=>({...f,image:e.target.value}))} className="flex-1 p-2 border rounded" />
        <input placeholder="Post Link" value={form.link} onChange={(e)=>setForm(f=>({...f,link:e.target.value}))} className="flex-1 p-2 border rounded" />
        <input placeholder="Caption" value={form.caption} onChange={(e)=>setForm(f=>({...f,caption:e.target.value}))} className="flex-1 p-2 border rounded" />
        <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving?"Saving":"Add"}</button>
      </form>

      <div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((p) => (
              <div key={p._id || p.id} className="p-3 border rounded flex items-start gap-3">
                <img src={p.image} alt="" className="w-24 h-24 object-cover rounded-md" />
                <div className="flex-1">
                  <div className="font-medium">{p.caption}</div>
                  <div className="text-xs text-gray-500 break-words">{p.link}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={()=>handleDelete(p._id||p.id)} className="text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
