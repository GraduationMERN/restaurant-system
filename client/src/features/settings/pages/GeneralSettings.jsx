// src/features/settings/pages/GeneralSettings.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useSettings } from '../../../context/SettingContext';
import api from '../../../api/axios';
import SettingsCard from '../components/SettingsCard';
import Input from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import Label from '../../../components/form/Label';
import { useTranslation } from 'react-i18next';

export default function GeneralSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  
  // Business Information
  const [restaurantName, setRestaurantName] = useState(settings.restaurantName);
  const [description, setDescription] = useState(settings.description || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  
  // Support Information
  const [supportEmail, setSupportEmail] = useState(settings.support?.email || '');
  const [supportPhone, setSupportPhone] = useState(settings.support?.phone || '');

  useEffect(() => {
    // Load initial data
    setRestaurantName(settings.restaurantName);
    setDescription(settings.description || '');
    setAddress(settings.address || '');
    setPhone(settings.phone || '');
    setSupportEmail(settings.support?.email || '');
    setSupportPhone(settings.support?.phone || '');
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        restaurantName,
        description,
        address,
        phone,
        support: {
          email: supportEmail,
          phone: supportPhone
        }
      };

      const res = await api.put("/api/restaurant/general", payload);
      updateSettings(res.data);
      toast.showToast({ 
        message: t("admin.settings_saved"), 
        type: "success" 
      });
    } catch (error) {
      toast.showToast({ 
        message: t("admin.settings_save_fail"), 
        type: "error" 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Information Card */}
      <SettingsCard 
        title={t("admin.restaurant_info")}
        description="Basic information about your restaurant"
        icon="🏢"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          <div className="lg:col-span-1">
            <Label>{t("restaurant_name")}</Label>
            <Input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Enter restaurant name"
            />
          </div>
          <div className="lg:col-span-1">
            <Label>{t("phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="lg:col-span-2">
            <Label>{t("popup.description")}</Label>
            <TextArea
              rows={3}
              value={description}
              onChange={setDescription}
              placeholder="Brief description of your restaurant"
            />
          </div>
          <div className="lg:col-span-2">
            <Label>{t("address")}</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full restaurant address"
            />
          </div>
        </div>
      </SettingsCard>

      {/* Support Information Card */}
      <SettingsCard 
        title={t("admin.contact_support")}
        description="Contact information for customer support"
        icon="📞"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label>{t("admin.support_email")}</Label>
            <Input 
              value={supportEmail} 
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@yourrestaurant.com"
            />
          </div>
          <div>
            <Label>{t("admin.support_phone")}</Label>
            <Input 
              value={supportPhone} 
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </SettingsCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}