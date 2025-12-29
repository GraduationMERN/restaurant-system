import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useSettingsAPI } from '../hooks/useSettingsAPI';

export default function SettingsExportImport() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const { exportSettings, importSettings } = useSettingsAPI();

  // Export settings
  const handleExport = async () => {
    setLoading(true);
    setValidationError(null);
    try {
      const data = await exportSettings();
      if (data) {
        setExportData(data);
      }
    } catch (err) {
      setValidationError(err.message || 'Failed to export settings');
    } finally {
      setLoading(false);
    }
  };

  // Download exported settings as JSON
  const handleDownload = () => {
    if (!exportData) return;

    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split('T')[0];
    element.download = `restaurant-settings-${timestamp}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    if (!exportData) return;
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert(isRTL ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard');
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const parsed = JSON.parse(content);
        setImportFile(parsed);
        setValidationError(null);
        setImportStatus(null);
      } catch (err) {
        setValidationError('Invalid JSON file');
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  // Validate import data structure
  const validateImportData = (data) => {
    const requiredKeys = [
      'systemSettings',
      'services',
      'paymentMethods',
      'websiteDesign',
      'integrations',
    ];

    const hasRequiredKeys = requiredKeys.some((key) => key in data);

    if (!hasRequiredKeys) {
      throw new Error('Invalid settings format. Missing required sections.');
    }

    return true;
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile) {
      setValidationError(isRTL ? 'الرجاء اختيار ملف' : 'Please select a file');
      return;
    }

    setLoading(true);
    setValidationError(null);
    setImportStatus(null);

    try {
      validateImportData(importFile);

      const result = await importSettings(importFile, {
        overwrite: importOverwrite,
      });

      if (result) {
        setImportStatus('success');
        setTimeout(() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportOverwrite(false);
          setImportStatus(null);
          // Optionally reload the page or refresh settings
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setValidationError(err.message || 'Failed to import settings');
    } finally {
      setLoading(false);
    }
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportData(null);
    setValidationError(null);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportOverwrite(false);
    setValidationError(null);
    setImportStatus(null);
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          {isRTL ? 'تصدير الإعدادات' : 'Export Settings'}
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Upload className="w-4 h-4" />
          {isRTL ? 'استيراد الإعدادات' : 'Import Settings'}
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'تصدير الإعدادات' : 'Export Settings'}
              </h2>
              <button
                onClick={closeExportModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {validationError && (
                <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
                </div>
              )}

              {!exportData ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {isRTL
                      ? 'سيتم تصدير جميع إعدادات مطعمك بتنسيق JSON. يمكنك استخدام هذا الملف للنسخ الاحتياطي أو نقل الإعدادات إلى مطعم آخر.'
                      : 'Export all your restaurant settings as JSON. Use this backup for recovery or transfer settings to another restaurant.'}
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading
                      ? isRTL
                        ? 'جاري التصدير...'
                        : 'Exporting...'
                      : isRTL
                      ? 'ابدأ التصدير'
                      : 'Start Export'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {isRTL
                        ? 'تم تصدير الإعدادات بنجاح'
                        : 'Settings exported successfully'}
                    </p>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs text-gray-700 dark:text-gray-300 break-words">
                    {JSON.stringify(exportData, null, 2).substring(0, 500)}...
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? `الحجم: ${(JSON.stringify(exportData).length / 1024).toFixed(2)} KB`
                      : `Size: ${(JSON.stringify(exportData).length / 1024).toFixed(2)} KB`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {exportData && (
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={closeExportModal}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  {isRTL ? 'إغلاق' : 'Close'}
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {isRTL ? 'نسخ إلى الحافظة' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  {isRTL ? 'تحميل' : 'Download'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'استيراد الإعدادات' : 'Import Settings'}
              </h2>
              <button
                onClick={closeImportModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {validationError && (
                <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
                </div>
              )}

              {importStatus === 'success' && (
                <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {isRTL
                      ? 'تم استيراد الإعدادات بنجاح. جاري إعادة تحميل الصفحة...'
                      : 'Settings imported successfully. Reloading page...'}
                  </p>
                </div>
              )}

              {!importStatus && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {isRTL ? 'اختر ملف JSON' : 'Select JSON File'}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="settings-file-input"
                      />
                      <label
                        htmlFor="settings-file-input"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {importFile ? importFile.restaurantName : isRTL ? 'اضغط أو اسحب الملف هنا' : 'Click or drag file here'}
                        </span>
                        {!importFile && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isRTL ? 'ملف JSON فقط' : 'JSON files only'}
                          </span>
                        )}
                      </label>
                    </div>
                  </div>

                  {importFile && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {isRTL
                          ? `الملف: ${importFile.restaurantName || 'Settings'}`
                          : `File: ${importFile.restaurantName || 'Settings'}`}
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importOverwrite}
                            onChange={(e) => setImportOverwrite(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {isRTL
                              ? 'استبدال جميع الإعدادات الحالية (بدلاً من الدمج)'
                              : 'Replace all current settings (instead of merging)'}
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {isRTL
                            ? 'الدمج: سيتم دمج الإعدادات الجديدة مع الحالية. الاستبدال: سيتم تجاهل جميع الإعدادات الحالية.'
                            : 'Merge: new settings combine with current. Replace: all current settings ignored.'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={closeImportModal}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
              {!importStatus && importFile && (
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading
                    ? isRTL
                      ? 'جاري الاستيراد...'
                      : 'Importing...'
                    : isRTL
                    ? 'استيراد الإعدادات'
                    : 'Import Settings'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
