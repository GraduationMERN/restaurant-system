// import React, { useEffect, useState } from "react";
// import { Trash2, Edit2, Plus } from "lucide-react";
// import api from "../../api/axios";
// import { useToast } from "../../hooks/useToast";

// const Offers = () => {
//   const [offers, setOffers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const { success, error } = useToast();

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     image: {
//       url: "",
//       public_id: "",
//     },
//     badge: "Offer",
//     discount: 0,
//     ctaLink: "/menu",
//     ctaText: "Shop Now",
//     startDate: new Date().toISOString().split("T")[0],
//     endDate: "",
//     isActive: true,
//   });

//   // Fetch all offers (admin)
//   const fetchOffers = async () => {
//     setLoading(true);
//     try {
//       const res = await api.get("/api/admin/offers");
//       if (res.data?.success) {
//         setOffers(res.data.data || []);
//       }
//     } catch (err) {
//       console.error("Failed to fetch offers:", err);
//       error("Failed to fetch offers");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOffers();
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;

//     if (name.startsWith("image.")) {
//       const imageField = name.split(".")[1];
//       setFormData((prev) => ({
//         ...prev,
//         image: {
//           ...prev.image,
//           [imageField]: value,
//         },
//       }));
//     } else if (type === "checkbox") {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: checked,
//       }));
//     } else if (name === "discount") {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: Math.min(100, Math.max(0, parseInt(value) || 0)),
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.title.trim() || !formData.image.url.trim()) {
//       error("Title and image URL are required");
//       return;
//     }

//     try {
//       if (editingId) {
//         // Update offer
//         const res = await api.put(`/api/admin/offers/${editingId}`, formData);
//         if (res.data?.success) {
//           success("Offer updated successfully");
//           fetchOffers();
//           resetForm();
//         }
//       } else {
//         // Create new offer
//         const res = await api.post("/api/admin/offers", formData);
//         if (res.data?.success) {
//           success("Offer created successfully");
//           fetchOffers();
//           resetForm();
//         }
//       }
//     } catch (err) {
//       console.error("Error:", err);
//       error(err.response?.data?.message || "Operation failed");
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       title: "",
//       description: "",
//       image: {
//         url: "",
//         public_id: "",
//       },
//       badge: "Offer",
//       discount: 0,
//       ctaLink: "/menu",
//       ctaText: "Shop Now",
//       startDate: new Date().toISOString().split("T")[0],
//       endDate: "",
//       isActive: true,
//     });
//     setEditingId(null);
//     setShowForm(false);
//   };

//   const handleEdit = (offer) => {
//     setFormData({
//       title: offer.title || "",
//       description: offer.description || "",
//       image: {
//         url: offer.image?.url || "",
//         public_id: offer.image?.public_id || "",
//       },
//       badge: offer.badge || "Offer",
//       discount: offer.discount || 0,
//       ctaLink: offer.ctaLink || "/menu",
//       ctaText: offer.ctaText || "Shop Now",
//       startDate: offer.startDate ? offer.startDate.split("T")[0] : "",
//       endDate: offer.endDate ? offer.endDate.split("T")[0] : "",
//       isActive: offer.isActive !== undefined ? offer.isActive : true,
//     });
//     setEditingId(offer._id);
//     setShowForm(true);
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this offer?")) return;

//     try {
//       const res = await api.delete(`/api/admin/offers/${id}`);
//       if (res.data?.success) {
//         success("Offer deleted successfully");
//         fetchOffers();
//       }
//     } catch (err) {
//       console.error("Error:", err);
//       error(err.response?.data?.message || "Failed to delete offer");
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-3xl font-bold">Manage Offers</h2>
//         <button
//           onClick={() => setShowForm(!showForm)}
//           className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
//         >
//           <Plus size={20} />
//           New Offer
//         </button>
//       </div>

//       {/* Form */}
//       {showForm && (
//         <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Title */}
//               <div>
//                 <label className="block font-semibold mb-2">Title *</label>
//                 <input
//                   type="text"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                   placeholder="e.g., Summer Sale"
//                 />
//               </div>

//               {/* Badge */}
//               <div>
//                 <label className="block font-semibold mb-2">Badge</label>
//                 <select
//                   name="badge"
//                   value={formData.badge}
//                   onChange={handleInputChange}
//                   className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 >
//                   <option value="Sale">Sale</option>
//                   <option value="Offer">Offer</option>
//                   <option value="Promotion">Promotion</option>
//                   <option value="Deal">Deal</option>
//                 </select>
//               </div>

//               {/* Discount */}
//               <div>
//                 <label className="block font-semibold mb-2">Discount (%)</label>
//                 <input
//                   type="number"
//                   name="discount"
//                   value={formData.discount}
//                   onChange={handleInputChange}
//                   min="0"
//                   max="100"
//                   className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 />
//               </div>

//               {/* CTA Text */}
//               <div>
//                 <label className="block font-semibold mb-2">CTA Button Text</label>
//                 <input
//                   type="text"
//                   name="ctaText"
//                   value={formData.ctaText}
//                   onChange={handleInputChange}
//                   className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                   placeholder="e.g., Shop Now"
//                 />
//               </div>
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block font-semibold mb-2">Description</label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 placeholder="Offer details"
//                 rows="3"
//               />
//             </div>

//             {/* Image URL */}
//             <div>
//               <label className="block font-semibold mb-2">Image URL *</label>
//               <input
//                 type="url"
//                 name="image.url"
//                 value={formData.image.url}
//                 onChange={handleInputChange}
//                 className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 placeholder="https://..."
//               />
//               {formData.image.url && (
//                 <img
//                   src={formData.image.url}
//                   alt="preview"
//                   className="mt-2 max-h-32 rounded"
//                 />
//               )}
//             </div>

//             {/* Public ID (for Cloudinary) */}
//             <div>
//               <label className="block font-semibold mb-2">Public ID (optional)</label>
//               <input
//                 type="text"
//                 name="image.public_id"
//                 value={formData.image.public_id}
//                 onChange={handleInputChange}
//                 className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 placeholder="Cloudinary public ID"
//               />
//             </div>

//             {/* CTA Link */}
//             <div>
//               <label className="block font-semibold mb-2">CTA Link</label>
//               <input
//                 type="text"
//                 name="ctaLink"
//                 value={formData.ctaLink}
//                 onChange={handleInputChange}
//                 className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 placeholder="e.g., /menu or https://..."
//               />
//             </div>

//             {/* Dates */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block font-semibold mb-2">Start Date</label>
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={formData.startDate}
//                   onChange={handleInputChange}
//                   className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 />
//               </div>
//               <div>
//                 <label className="block font-semibold mb-2">End Date (optional)</label>
//                 <input
//                   type="date"
//                   name="endDate"
//                   value={formData.endDate}
//                   onChange={handleInputChange}
//                   className="w-full border dark:bg-gray-700 dark:border-gray-600 p-2 rounded"
//                 />
//               </div>
//             </div>

//             {/* Active */}
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 name="isActive"
//                 checked={formData.isActive}
//                 onChange={handleInputChange}
//                 className="w-4 h-4 cursor-pointer"
//               />
//               <label className="font-semibold">Active</label>
//             </div>

//             {/* Buttons */}
//             <div className="flex gap-2 pt-4">
//               <button
//                 type="submit"
//                 className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
//               >
//                 {editingId ? "Update Offer" : "Create Offer"}
//               </button>
//               <button
//                 type="button"
//                 onClick={resetForm}
//                 className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Offers List */}
//       {loading ? (
//         <p className="text-center">Loading offers...</p>
//       ) : offers.length === 0 ? (
//         <p className="text-center text-gray-500">No offers created yet</p>
//       ) : (
//         <div className="space-y-4">
//           {offers.map((offer) => (
//             <div
//               key={offer._id}
//               className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4"
//             >
//               {/* Image */}
//               {offer.image?.url && (
//                 <img
//                   src={offer.image.url}
//                   alt={offer.title}
//                   className="w-24 h-24 object-cover rounded"
//                 />
//               )}

//               {/* Info */}
//               <div className="grow">
//                 <div className="flex items-start justify-between mb-2">
//                   <div>
//                     <h3 className="font-bold text-lg">{offer.title}</h3>
//                     <div className="flex gap-2 items-center">
//                       <span className="text-xs bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
//                         {offer.badge}
//                       </span>
//                       {offer.discount > 0 && (
//                         <span className="text-xs bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
//                           {offer.discount}% OFF
//                         </span>
//                       )}
//                       <span
//                         className={`text-xs px-2 py-1 rounded ${
//                           offer.isActive
//                             ? "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
//                             : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
//                         }`}
//                       >
//                         {offer.isActive ? "Active" : "Inactive"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {offer.description && (
//                   <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
//                     {offer.description}
//                   </p>
//                 )}

//                 <p className="text-xs text-gray-500">
//                   {offer.startDate &&
//                     `From ${new Date(offer.startDate).toLocaleDateString()}`}
//                   {offer.endDate &&
//                     ` to ${new Date(offer.endDate).toLocaleDateString()}`}
//                 </p>
//               </div>

//               {/* Actions */}
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => handleEdit(offer)}
//                   className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
//                 >
//                   <Edit2 size={16} />
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(offer._id)}
//                   className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
//                 >
//                   <Trash2 size={16} />
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Offers;
import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, X, Calendar, Tag, Percent, Link as LinkIcon, Image as ImageIcon, Eye, EyeOff, ExternalLink, CheckCircle, Clock, Filter } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../hooks/useToast";

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      startDate: offer.startDate ? offer.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
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

  // Filter offers based on search and status
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && offer.isActive) ||
                         (statusFilter === "inactive" && !offer.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusColor = (isActive) => {
    return isActive 
      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
  };

  // Get badge color
  const getBadgeColor = (badge) => {
    const colors = {
      Sale: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      Offer: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      Promotion: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
      Deal: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
    };
    return colors[badge] || colors.Offer;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No end date";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Manage Offers
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage promotional offers for your customers
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg font-medium"
            >
              <Plus size={20} />
              {editingId ? "Edit Offer" : "New Offer"}
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${statusFilter === "all" 
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${statusFilter === "active" 
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"}`}
              >
                <CheckCircle size={16} />
                Active
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${statusFilter === "inactive" 
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"}`}
              >
                <EyeOff size={16} />
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Form Card */}
        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingId ? "Edit Offer" : "Create New Offer"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Summer Sale 2024"
                    required
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Tag size={16} />
                    Badge Type
                  </label>
                  <select
                    name="badge"
                    value={formData.badge}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="Sale">Sale</option>
                    <option value="Offer">Offer</option>
                    <option value="Promotion">Promotion</option>
                    <option value="Deal">Deal</option>
                  </select>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Percent size={16} />
                    Discount (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-10"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-500 dark:text-gray-400">%</span>
                  </div>
                </div>

                {/* CTA Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    name="ctaText"
                    value={formData.ctaText}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Shop Now"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Describe your offer in detail..."
                  rows="3"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <ImageIcon size={16} />
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="image.url"
                  value={formData.image.url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="https://example.com/image.jpg"
                  required
                />
                {formData.image.url && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <img
                      src={formData.image.url}
                      alt="preview"
                      className="max-h-48 rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                )}
              </div>

              {/* CTA Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <LinkIcon size={16} />
                  Button Link
                </label>
                <input
                  type="text"
                  name="ctaLink"
                  value={formData.ctaLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., /menu or https://..."
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Offer Status</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.isActive ? "This offer is currently active and visible to customers" : "This offer is hidden from customers"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                >
                  {editingId ? "Update Offer" : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Offers List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {offers.length === 0 ? "No offers yet" : "No matching offers"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {offers.length === 0 
                ? "Get started by creating your first promotional offer to attract more customers."
                : "Try adjusting your search or filter to find what you're looking for."}
            </p>
            {offers.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Create Your First Offer
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOffers.map((offer) => (
              <div
                key={offer._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Offer Header */}
                <div className="relative h-48 overflow-hidden">
                  {offer.image?.url ? (
                    <img
                      src={offer.image.url}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                      <ImageIcon size={48} className="text-blue-400 dark:text-blue-500" />
                    </div>
                  )}
                  
                  {/* Badge and Status */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getBadgeColor(offer.badge)}`}>
                      {offer.badge}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(offer.isActive)} flex items-center gap-1.5`}>
                      {offer.isActive ? (
                        <>
                          <CheckCircle size={12} />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {offer.discount > 0 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                      {offer.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Offer Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {offer.title}
                      </h3>
                      {offer.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                          {offer.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>Start: {formatDate(offer.startDate)}</span>
                    </div>
                    {offer.endDate && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>End: {formatDate(offer.endDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="mb-6">
                    <a
                      href={offer.ctaLink}
                      target={offer.ctaLink.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      {offer.ctaText || "Shop Now"}
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(offer)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(offer._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {offers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Offers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{offers.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Offers</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {offers.filter(o => o.isActive).length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">With Discount</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {offers.filter(o => o.discount > 0).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;