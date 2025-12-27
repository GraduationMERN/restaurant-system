// src/features/settings/pages/WebsiteSettings.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useSettings } from '../../../context/SettingContext';
import api from '../../../api/axios';
import SettingsCard from '../components/SettingsCard';
import Input from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';
import { useTranslation } from 'react-i18next';

export default function WebsiteSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  
  // About & Content
  const [aboutTitle, setAboutTitle] = useState(settings.about?.title || "About Us");
  const [aboutContent, setAboutContent] = useState(settings.about?.content || "");
  
  // FAQs
  const [faqs, setFaqs] = useState(settings.faqs || []);

  useEffect(() => {
    setAboutTitle(settings.about?.title || "About Us");
    setAboutContent(settings.about?.content || "");
    setFaqs(Array.isArray(settings.faqs) ? settings.faqs : []);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        about: { title: aboutTitle, content: aboutContent },
        faqs
      };

      const res = await api.put("/api/restaurant/website", payload);
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
      {/* About Us Card */}
      <SettingsCard 
        title={t("admin.about_us")}
        description="Information displayed on your About page"
        icon="📝"
      >
        <div className="space-y-5">
          <div>
            <Label>{t("admin.about_title_label")}</Label>
            <Input 
              value={aboutTitle} 
              onChange={(e) => setAboutTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>{t("admin.about_content_label")}</Label>
            <TextArea 
              rows={4} 
              value={aboutContent} 
              onChange={setAboutContent}
            />
          </div>
        </div>
      </SettingsCard>

      {/* FAQs Card - Copy your original FAQ section here */}
      <SettingsCard 
        title={t("admin.faqs")}
        description="Frequently Asked Questions"
        icon="❓"
      >
        {/* Copy your FAQ component from original */}
        {/* ... */}
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Content'}
        </button>
      </div>
    </div>
  );
}