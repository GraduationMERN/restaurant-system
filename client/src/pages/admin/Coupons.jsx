import { useEffect, useState } from "react";
import { Trash2, Edit, Plus, X } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../hooks/useToast";
import api from "../../api/axios";
import { useTranslation } from "react-i18next";

export default function Coupons() {
  const { t } = useTranslation();
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: 10,
    maxUses: 100,
    expiryDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load coupons
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/coupons");
      setCoupons(res.data.coupons || []);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast.showToast({ message: "Failed to load coupons", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountPercentage: 10,
      maxUses: 100,
      expiryDate: "",
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingId(coupon._id);
    setFormData({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      maxUses: coupon.maxUses,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.showToast({ message: "Coupon code is required", type: "error" });
      return;
    }

    if (formData.discountPercentage < 1 || formData.discountPercentage > 100) {
      toast.showToast({ message: "Discount must be between 1 and 100", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update
        const res = await api.put(`/api/coupons/${editingId}`, formData);
        setCoupons(coupons.map(c => c._id === editingId ? res.data.coupon : c));
        toast.showToast({ message: "Coupon updated successfully", type: "success" });
      } else {
        // Create
        const res = await api.post("/api/coupons", formData);
        setCoupons([...coupons, res.data.coupon]);
        toast.showToast({ message: "Coupon created successfully", type: "success" });
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.showToast({ 
        message: error.response?.data?.message || "Failed to save coupon", 
        type: "error" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await api.delete(`/api/coupons/${id}`);
      setCoupons(coupons.filter(c => c._id !== id));
      toast.showToast({ message: "Coupon deleted successfully", type: "success" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.showToast({ message: "Failed to delete coupon", type: "error" });
    }
  };

  return (
    <>
      <PageMeta title={t("admin.coupons_title")} description={t("admin.coupons_desc")} />
      <PageBreadcrumb pageTitle={t("admin.coupons_title")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("admin.coupon_management")}
          </h3>
          <Button 
            variant="primary" 
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("admin.add_coupon")}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">{t("admin.no_coupons")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t("admin.code")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t("admin.discount")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t("admin.max_uses")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t("admin.used")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t("admin.expiry")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{coupon.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{coupon.discountPercentage}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{coupon.maxUses}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{coupon.usedCount || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "No expiry"}
                    </td>
                    <td className="px-4 py-3 text-sm flex gap-2">
                      <button
                        onClick={() => openEditModal(coupon)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? t("admin.edit_item") : t("admin.add_coupon")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("admin.coupon_code")}
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE10"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("admin.discount_percentage")}
                </label>
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: Math.min(100, Math.max(1, parseInt(e.target.value) || 0)) })}
                  min="1"
                  max="100"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("admin.max_uses")}
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: Math.max(1, parseInt(e.target.value) || 1) })}
                  min="1"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("admin.expiry_date_optional")}
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                loading={submitting}
                className="flex-1"
              >
                {editingId ? t("update") : t("create")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
