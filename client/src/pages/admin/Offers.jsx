import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../hooks/useToast";

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: {
      url: "",
      public_id: "",
    },
    badge: "Offer",
    discount: 0,
    ctaLink: "/menu",
    ctaText: "Shop Now",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isActive: true,
  });

  // Fetch all offers (admin)
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/offers");
      if (res.data?.success) {
        setOffers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch offers:", err);
      error("Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("image.")) {
      const imageField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        image: {
          ...prev.image,
          [imageField]: value,
        },
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === "discount") {
      setFormData((prev) => ({
        ...prev,
        [name]: Math.min(100, Math.max(0, parseInt(value) || 0)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.image.url.trim()) {
      error("Title and image URL are required");
      return;
    }

    try {
      if (editingId) {
        // Update offer
        const res = await api.put(`/api/admin/offers/${editingId}`, formData);
        if (res.data?.success) {
          success("Offer updated successfully");
          fetchOffers();
          resetForm();
        }
      } else {
        // Create new offer
        const res = await api.post("/api/admin/offers", formData);
        if (res.data?.success) {
          success("Offer created successfully");
          fetchOffers();
          resetForm();
        }
      }
    } catch (err) {
      console.error("Error:", err);
      error(err.response?.data?.message || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: {
        url: "",
        public_id: "",
      },
      badge: "Offer",
      discount: 0,
      ctaLink: "/menu",
      ctaText: "Shop Now",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (offer) => {
    setFormData({
      title: offer.title || "",
      description: offer.description || "",
      image: {
        url: offer.image?.url || "",
        public_id: offer.image?.public_id || "",
      },
      badge: offer.badge || "Offer",
      discount: offer.discount || 0,
      ctaLink: offer.ctaLink || "/menu",
      ctaText: offer.ctaText || "Shop Now",
      startDate: offer.startDate ? offer.startDate.split("T")[0] : "",
      endDate: offer.endDate ? offer.endDate.split("T")[0] : "",
      isActive: offer.isActive !== undefined ? offer.isActive : true,
    });
    setEditingId(offer._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;

    try {
      const res = await api.delete(`/api/admin/offers/${id}`);
      if (res.data?.success) {
        success("Offer deleted successfully");
        fetchOffers();
      }
    } catch (err) {
      console.error("Error:", err);
      error(err.response?.data?.message || "Failed to delete offer");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Manage Offers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          New Offer
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block font-semibold mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                  placeholder="e.g., Summer Sale"
                />
              </div>

              {/* Badge */}
              <div>
                <label className="block font-semibold mb-2">Badge</label>
                <select
                  name="badge"
                  value={formData.badge}
                  onChange={handleInputChange}
                  className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                >
                  <option value="Sale">Sale</option>
                  <option value="Offer">Offer</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Deal">Deal</option>
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block font-semibold mb-2">Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                />
              </div>

              {/* CTA Text */}
              <div>
                <label className="block font-semibold mb-2">CTA Button Text</label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleInputChange}
                  className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                  placeholder="e.g., Shop Now"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                placeholder="Offer details"
                rows="3"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block font-semibold mb-2">Image URL *</label>
              <input
                type="url"
                name="image.url"
                value={formData.image.url}
                onChange={handleInputChange}
                className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                placeholder="https://..."
              />
              {formData.image.url && (
                <img
                  src={formData.image.url}
                  alt="preview"
                  className="mt-2 max-h-32 rounded"
                />
              )}
            </div>

            {/* Public ID (for Cloudinary) */}
            <div>
              <label className="block font-semibold mb-2">Public ID (optional)</label>
              <input
                type="text"
                name="image.public_id"
                value={formData.image.public_id}
                onChange={handleInputChange}
                className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                placeholder="Cloudinary public ID"
              />
            </div>

            {/* CTA Link */}
            <div>
              <label className="block font-semibold mb-2">CTA Link</label>
              <input
                type="text"
                name="ctaLink"
                value={formData.ctaLink}
                onChange={handleInputChange}
                className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                placeholder="e.g., /menu or https://..."
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">End Date (optional)</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 cursor-pointer"
              />
              <label className="font-semibold">Active</label>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {editingId ? "Update Offer" : "Create Offer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Offers List */}
      {loading ? (
        <p className="text-center">Loading offers...</p>
      ) : offers.length === 0 ? (
        <p className="text-center text-gray-500">No offers created yet</p>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4"
            >
              {/* Image */}
              {offer.image?.url && (
                <img
                  src={offer.image.url}
                  alt={offer.title}
                  className="w-24 h-24 object-cover rounded"
                />
              )}

              {/* Info */}
              <div className="grow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{offer.title}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                        {offer.badge}
                      </span>
                      {offer.discount > 0 && (
                        <span className="text-xs bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                          {offer.discount}% OFF
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          offer.isActive
                            ? "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {offer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {offer.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {offer.description}
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  {offer.startDate &&
                    `From ${new Date(offer.startDate).toLocaleDateString()}`}
                  {offer.endDate &&
                    ` to ${new Date(offer.endDate).toLocaleDateString()}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(offer)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(offer._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;
