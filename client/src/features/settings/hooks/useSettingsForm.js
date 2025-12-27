// src/features/settings/hooks/useSettingsForm.js
export function useSettingsForm(initialData, sectionKey) {
  const [formData, setFormData] = useState(initialData);
  const { updateSettings } = useSettings();
  
  const handleSave = async () => {
    // Save only the section data
    await api.put(`/api/settings/${sectionKey}`, formData);
    updateSettings({ [sectionKey]: formData });
  };
  
  return { formData, setFormData, handleSave };
}