import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsAPI } from '../hooks/useSettingsAPI';
import {
  Trash2,
  Plus,
  AlertCircle,
  Edit2,
  X,
  Check,
  CreditCard,
} from 'lucide-react';

export default function PaymentMethodsSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [methods, setMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    type: 'card',
    enabled: true,
    fee: 0,
    description: '',
    descriptionAr: '',
  });

  const {
    getPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    togglePaymentMethod,
  } = useSettingsAPI();

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    const data = await getPaymentMethods();
    if (data) {
      setMethods(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      nameAr: '',
      type: 'card',
      enabled: true,
      fee: 0,
      description: '',
      descriptionAr: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (method) => {
    setFormData({
      name: method.name || '',
      nameAr: method.nameAr || '',
      type: method.type || 'card',
      enabled: method.enabled !== false,
      fee: method.fee || 0,
      description: method.description || '',
      descriptionAr: method.descriptionAr || '',
    });
    setEditingId(method._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (editingId) {
      const success = await updatePaymentMethod(editingId, formData);
      if (success) {
        await loadMethods();
        handleReset();
      }
    } else {
      const success = await addPaymentMethod(formData);
      if (success) {
        await loadMethods();
        handleReset();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (methodId) => {
    if (window.confirm(isRTL ? 'هل تريد حذف هذه الطريقة؟' : 'Are you sure?')) {
      const success = await removePaymentMethod(methodId);
      if (success) {
        await loadMethods();
      }
    }
  };

  const handleToggle = async (methodId, currentEnabled) => {
    const success = await togglePaymentMethod(methodId, !currentEnabled);
    if (success) {
      await loadMethods();
    }
  };

  const paymentTypes = [
    { value: 'card', label: isRTL ? 'بطاقة ائتمان' : 'Credit Card' },
    { value: 'wallet', label: isRTL ? 'محفظة رقمية' : 'Digital Wallet' },
    { value: 'bank', label: isRTL ? 'تحويل بنكي' : 'Bank Transfer' },
    { value: 'cash', label: isRTL ? 'دفع عند الاستلام' : 'Cash on Delivery' },
    { value: 'apple_pay', label: 'Apple Pay' },
    { value: 'google_pay', label: 'Google Pay' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {isRTL
            ? 'إدارة طرق الدفع المتاحة للعملاء. يمكنك إضافة أو تعديل أو حذف الطرق.'
            : 'Manage payment methods available to customers'}
        </p>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId
                ? isRTL
                  ? 'تعديل طريقة الدفع'
                  : 'Edit Payment Method'
                : isRTL
                ? 'إضافة طريقة دفع جديدة'
                : 'Add New Payment Method'}
            </h3>
            <button
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'اسم الطريقة (English)' : 'Method Name (English)'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Visa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'اسم الطريقة (عربي)' : 'Method Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثلاً: فيزا"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'نوع الطريقة' : 'Payment Type'}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'رسوم المعاملة (%)' : 'Transaction Fee (%)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fee}
                  onChange={(e) =>
                    setFormData({ ...formData, fee: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الوصف (English)' : 'Description (English)'}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional description"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <input
                  type="text"
                  value={formData.descriptionAr}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionAr: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف إضافي"
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4">
                  {isRTL ? 'تفعيل' : 'Enable'}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, enabled: !formData.enabled })
                  }
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                    formData.enabled
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.enabled
                        ? 'translate-x-6 rtl:-translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
                {saving
                  ? isRTL
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                  : isRTL
                  ? 'حفظ'
                  : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="space-y-3">
        {methods.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isRTL ? 'لم يتم إضافة طرق دفع حتى الآن' : 'No payment methods added yet'}
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isRTL ? 'إضافة طريقة دفع' : 'Add Payment Method'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map((method) => (
              <div
                key={method._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {isRTL ? method.nameAr || method.name : method.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {method.type}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle(method._id, method.enabled)
                    }
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors flex-shrink-0 ${
                      method.enabled
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        method.enabled
                          ? 'translate-x-6 rtl:-translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {method.fee > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {isRTL ? 'الرسم: ' : 'Fee: '}{method.fee}%
                  </p>
                )}

                {method.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {isRTL ? method.descriptionAr : method.description}
                  </p>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(method)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {isRTL ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(method._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isRTL ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button */}
      {!showForm && methods.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة طريقة دفع' : 'Add Payment Method'}
        </button>
      )}
    </div>
  );
}
