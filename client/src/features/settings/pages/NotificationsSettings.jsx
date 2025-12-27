// src/features/settings/pages/NotificationsSettings.jsx
import { useState } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useSettings } from '../../../context/SettingContext';
import api from '../../../api/axios';
import SettingsCard from '../components/SettingsCard';
import Checkbox from '../../../components/form/input/Checkbox';
import { useTranslation } from 'react-i18next';

export default function NotificationsSettings() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  
  // Notification toggles
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyReview, setNotifyReview] = useState(true);
  const [notifyDailySales, setNotifyDailySales] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        notifications: {
          newOrder: notifyNewOrder,
          review: notifyReview,
          dailySales: notifyDailySales,
          lowStock: notifyLowStock
        }
      };

      await api.put("/api/restaurant/notifications", payload);
      toast.showToast({ message: t("admin.settings_saved"), type: "success" });
    } catch (error) {
      toast.showToast({ message: t("admin.settings_save_fail"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard 
        title={t("admin.notifications")}
        description="Configure your notification preferences"
        icon=""
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Checkbox 
              label={t("admin.new_order_alerts")} 
              checked={notifyNewOrder} 
              onChange={setNotifyNewOrder} 
            />
            <Checkbox 
              label={t("admin.review_notifications")} 
              checked={notifyReview} 
              onChange={setNotifyReview} 
            />
          </div>
          <div className="space-y-3">
            <Checkbox 
              label={t("admin.daily_sales_reports")} 
              checked={notifyDailySales} 
              onChange={setNotifyDailySales} 
            />
            <Checkbox 
              label={t("admin.low_stock_alerts")} 
              checked={notifyLowStock} 
              onChange={setNotifyLowStock} 
            />
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Notifications'}
        </button>
      </div>
    </div>
  );
}