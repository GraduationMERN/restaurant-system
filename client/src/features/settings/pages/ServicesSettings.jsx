// src/features/settings/pages/ServicesSettings.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useSettings } from '../../../context/SettingContext';
import api from '../../../api/axios';
import SettingsCard from '../components/SettingsCard';
import TextArea from '../../../components/form/input/TextArea';
import Label from '../../../components/form/Label';
import { useTranslation } from 'react-i18next';

export default function ServicesSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  
  // Policies
  const [terms, setTerms] = useState(settings.policies?.terms || "");
  const [privacy, setPrivacy] = useState(settings.policies?.privacy || "");

  useEffect(() => {
    setTerms(settings.policies?.terms || "");
    setPrivacy(settings.policies?.privacy || "");
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        policies: { terms, privacy }
      };

      const res = await api.put("/api/restaurant/policies", payload);
      updateSettings(res.data);
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
        title={t("admin.policies_agreements")}
        description="Legal policies and terms"
        icon=""
      >
        <div className="space-y-5">
          <div>
            <Label>{t("admin.terms_of_service")}</Label>
            <TextArea rows={11} value={terms} onChange={setTerms} />
          </div>
          <div>
            <Label>{t("admin.privacy_policy")}</Label>
            <TextArea rows={11} value={privacy} onChange={setPrivacy} />
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Policies'}
        </button>
      </div>
    </div>
  );
}