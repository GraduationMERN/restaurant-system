// src/features/settings/pages/BrandingSettings.jsx
import { useState, useRef } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useSettings } from '../../../context/SettingContext';
import api from '../../../api/axios';
import SettingsCard from '../components/SettingsCard';
import ColorPicker from '../../../components/form/ColorPicker';
import Label from '../../../components/form/Label';
import { useTranslation } from 'react-i18next';

export default function BrandingSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  
  // Branding state
  const [primaryColor, setPrimaryColor] = useState(settings.branding?.primaryColor || "#FF5733");
  const [secondaryColor, setSecondaryColor] = useState(settings.branding?.secondaryColor || "#33C3FF");
  const [logoPreview, setLogoPreview] = useState(settings.branding?.logoUrl || "");
  const [logoFile, setLogoFile] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState(settings.branding?.menuImage || "");
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const menuImageInputRef = useRef(null);

  // File upload handlers (copy from your original)
  const triggerLogoUpload = () => fileInputRef.current?.click();
  
  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = logoPreview;
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const uploadRes = await api.post('/api/restaurant/upload-logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        logoUrl = uploadRes.data.logoUrl;
      }

      let menuImage = menuImagePreview;
      if (menuImageFile) {
        const formData = new FormData();
        formData.append('menuImage', menuImageFile);
        const uploadRes = await api.post('/api/restaurant/upload-menu-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        menuImage = uploadRes.data.menuImageUrl;
      }

      const payload = {
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl,
          menuImage,
        }
      };

      const res = await api.put("/api/restaurant/branding", payload);
      updateSettings(res.data);
      toast.showToast({ message: t("admin.settings_saved"), type: "success" });
      
      setLogoFile(null);
      setMenuImageFile(null);
    } catch (error) {
      toast.showToast({ message: t("admin.settings_save_fail"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Keep your original handleGenerateMenuImage function here

  return (
    <div className="space-y-6">
      {/* Colors Card */}
      <SettingsCard 
        title={t("admin.colors_theme")}
        description="Customize your brand colors"
        icon=""
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ColorPicker
            label={t("admin.primary_color")}
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorPicker
            label={t("admin.reward_color")}
            value={secondaryColor}
            onChange={setSecondaryColor}
          />
        </div>
      </SettingsCard>

      {/* Logo Upload Card */}
      <SettingsCard 
        title={t("admin.logo_branding")}
        description="Upload your restaurant logo"
        icon=""
      >
        <Label>{t("admin.logo")}</Label>
        <div className="flex items-center gap-4 mt-2">
          <div className="h-14 w-14 overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={triggerLogoUpload}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {logoPreview ? t("admin.change_logo") : t("admin.upload_logo")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file && file.type.startsWith("image/")) {
                setLogoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setLogoPreview(String(reader.result || ""));
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      </SettingsCard>

      {/* Menu Image Card - Keep your original implementation */}
      <SettingsCard 
        title={t("admin.menu_image")}
        description="Upload or generate menu images"
        icon=""
      >
        {/* Copy your menu image section from original */}
        {/* ... */}
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}