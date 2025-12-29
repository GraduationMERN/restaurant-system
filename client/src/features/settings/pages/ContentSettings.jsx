import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsAPI } from '../hooks/useSettingsAPI';
import {
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  HelpCircle,
  FileText,
} from 'lucide-react';

export default function ContentSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [policies, setPolicies] = useState({
    terms: '',
    termsAr: '',
    privacy: '',
    privacyAr: '',
    cancellation: '',
    cancellationAr: '',
    returns: '',
    returnsAr: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [editingFAQId, setEditingFAQId] = useState(null);
  const [faqFormData, setFAQFormData] = useState({
    question: '',
    questionAr: '',
    answer: '',
    answerAr: '',
    category: '',
  });

  const {
    getFAQs,
    addFAQ,
    updateFAQ,
    removeFAQ,
    getPolicies,
    updatePolicies: updatePoliciesAPI,
  } = useSettingsAPI();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    const [faqsData, policiesData] = await Promise.all([
      getFAQs(),
      getPolicies(),
    ]);
    if (faqsData) {
      setFaqs(Array.isArray(faqsData) ? faqsData : []);
    }
    if (policiesData) {
      setPolicies((prev) => ({ ...prev, ...policiesData }));
    }
    setLoading(false);
  };

  // FAQ Handlers
  const handleResetFAQForm = () => {
    setFAQFormData({
      question: '',
      questionAr: '',
      answer: '',
      answerAr: '',
      category: '',
    });
    setEditingFAQId(null);
    setShowFAQForm(false);
  };

  const handleEditFAQ = (faq) => {
    setFAQFormData({
      question: faq.question || '',
      questionAr: faq.questionAr || '',
      answer: faq.answer || '',
      answerAr: faq.answerAr || '',
      category: faq.category || '',
    });
    setEditingFAQId(faq._id);
    setShowFAQForm(true);
  };

  const handleSubmitFAQ = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (editingFAQId) {
      const success = await updateFAQ(editingFAQId, faqFormData);
      if (success) {
        await loadContent();
        handleResetFAQForm();
      }
    } else {
      const success = await addFAQ(faqFormData);
      if (success) {
        await loadContent();
        handleResetFAQForm();
      }
    }

    setSaving(false);
  };

  const handleDeleteFAQ = async (faqId) => {
    if (window.confirm(isRTL ? 'هل تريد حذف هذا السؤال؟' : 'Are you sure?')) {
      const success = await removeFAQ(faqId);
      if (success) {
        await loadContent();
      }
    }
  };

  // Policy Handlers
  const handlePolicyChange = (field, value) => {
    setPolicies((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSavePolicies = async () => {
    setSaving(true);
    const success = await updatePoliciesAPI(policies);
    if (success) {
      setHasChanges(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const faqCategories = [
    { value: 'general', label: isRTL ? 'أسئلة عامة' : 'General' },
    { value: 'ordering', label: isRTL ? 'طرق الطلب' : 'Ordering' },
    { value: 'payment', label: isRTL ? 'الدفع' : 'Payment' },
    { value: 'delivery', label: isRTL ? 'التوصيل' : 'Delivery' },
    { value: 'account', label: isRTL ? 'الحساب' : 'Account' },
    { value: 'returns', label: isRTL ? 'الاسترجاع' : 'Returns' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {isRTL
            ? 'إدارة الأسئلة الشائعة والسياسات الخاصة بمتجرك'
            : 'Manage FAQs and policies for your restaurant'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'faqs', label: isRTL ? 'الأسئلة الشائعة' : 'FAQs', icon: '❓' },
          { id: 'policies', label: isRTL ? 'السياسات' : 'Policies', icon: '📋' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          {/* Add FAQ Form */}
          {showFAQForm && (
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingFAQId
                    ? isRTL
                      ? 'تعديل السؤال'
                      : 'Edit FAQ'
                    : isRTL
                    ? 'إضافة سؤال جديد'
                    : 'Add New FAQ'}
                </h3>
                <button
                  onClick={handleResetFAQForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitFAQ} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'الفئة' : 'Category'}
                    </label>
                    <select
                      value={faqFormData.category}
                      onChange={(e) =>
                        setFAQFormData({
                          ...faqFormData,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{isRTL ? 'اختر فئة' : 'Select Category'}</option>
                      {faqCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'السؤال (English)' : 'Question (English)'}
                    </label>
                    <input
                      type="text"
                      value={faqFormData.question}
                      onChange={(e) =>
                        setFAQFormData({
                          ...faqFormData,
                          question: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., How do I place an order?"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'السؤال (عربي)' : 'Question (Arabic)'}
                    </label>
                    <input
                      type="text"
                      value={faqFormData.questionAr}
                      onChange={(e) =>
                        setFAQFormData({
                          ...faqFormData,
                          questionAr: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثلاً: كيف أضع طلباً؟"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'الإجابة (English)' : 'Answer (English)'}
                    </label>
                    <textarea
                      value={faqFormData.answer}
                      onChange={(e) =>
                        setFAQFormData({
                          ...faqFormData,
                          answer: e.target.value,
                        })
                      }
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write the answer here..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'الإجابة (عربي)' : 'Answer (Arabic)'}
                    </label>
                    <textarea
                      value={faqFormData.answerAr}
                      onChange={(e) =>
                        setFAQFormData({
                          ...faqFormData,
                          answerAr: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اكتب الإجابة هنا..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleResetFAQForm}
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

          {/* FAQs List */}
          <div className="space-y-3">
            {faqs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {isRTL ? 'لم يتم إضافة أسئلة حتى الآن' : 'No FAQs added yet'}
                </p>
                {!showFAQForm && (
                  <button
                    onClick={() => setShowFAQForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'إضافة سؤال' : 'Add FAQ'}
                  </button>
                )}
              </div>
            ) : (
              faqs.map((faq) => (
                <div
                  key={faq._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                          {faq.category || 'general'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {isRTL ? faq.questionAr || faq.question : faq.question}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {isRTL ? faq.answerAr || faq.answer : faq.answer}
                      </p>
                    </div>

                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleEditFAQ(faq)}
                        className="p-2 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(faq._id)}
                        className="p-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!showFAQForm && faqs.length > 0 && (
            <button
              onClick={() => setShowFAQForm(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {isRTL ? 'إضافة سؤال' : 'Add FAQ'}
            </button>
          )}
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              {
                key: 'terms',
                label: isRTL ? 'شروط الخدمة' : 'Terms of Service',
              },
              {
                key: 'privacy',
                label: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy',
              },
              {
                key: 'cancellation',
                label: isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy',
              },
              {
                key: 'returns',
                label: isRTL ? 'سياسة الاسترجاع' : 'Return Policy',
              },
            ].map((policy) => (
              <div
                key={policy.key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {policy.label}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? `${policy.label} (English)` : `${policy.label} (English)`}
                    </label>
                    <textarea
                      value={policies[policy.key] || ''}
                      onChange={(e) =>
                        handlePolicyChange(policy.key, e.target.value)
                      }
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${policy.label}...`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? `${policy.label} (عربي)` : `${policy.label} (Arabic)`}
                    </label>
                    <textarea
                      value={policies[`${policy.key}Ar`] || ''}
                      onChange={(e) =>
                        handlePolicyChange(
                          `${policy.key}Ar`,
                          e.target.value
                        )
                      }
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`أدخل ${policy.label}...`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => loadContent()}
              disabled={!hasChanges}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSavePolicies}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving
                ? isRTL
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isRTL
                ? 'حفظ'
                : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
