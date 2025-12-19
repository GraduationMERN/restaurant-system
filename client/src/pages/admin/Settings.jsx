import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useSettings } from "../../context/SettingContext";
import api from "../../api/axios";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const [restaurantName, setRestaurantName] = useState(settings.restaurantName);
  const [description, setDescription] = useState(
    "Authentic Italian cuisine with a modern twist"
  );
  const [address, setAddress] = useState("123 Main Street, City, State 12345");
  const [phone, setPhone] = useState(settings.phone);

  const [primaryColor, setPrimaryColor] = useState(settings.color || "#FF5733");
  const [secondaryColor, setSecondaryColor] = useState(
    settings.secondaryColor || "#33C3FF"
  );
  const [logoPreview, setLogoPreview] = useState(
    settings.branding?.logoUrl || ""
  );
  const [logoFile, setLogoFile] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState(
    settings.branding?.menuImage || ""
  );
  const [menuImageFile, setMenuImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const menuImageInputRef = useRef(null);

  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyReview, setNotifyReview] = useState(true);
  const [notifyDailySales, setNotifyDailySales] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(false);

  const [aboutTitle, setAboutTitle] = useState(settings.about?.title || "About Us");
  const [aboutContent, setAboutContent] = useState(settings.about?.content || "");
  const [supportEmail, setSupportEmail] = useState(settings.support?.email || "");
  const [supportPhone, setSupportPhone] = useState(settings.support?.phone || "");
  const [faqs, setFaqs] = useState(settings.faqs || []);
  const [terms, setTerms] = useState(settings.policies?.terms || "");
  const [privacy, setPrivacy] = useState(settings.policies?.privacy || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const res = await api.get("/api/restaurant");
      const data = res.data;

      updateSettings(data); // context update

      // local state update
      setRestaurantName(data.restaurantName);
      setDescription(data.description);
      setAddress(data.address);
      setPhone(data.phone);
      setPrimaryColor(data.branding?.primaryColor || "#FF5733");
      setSecondaryColor(data.branding?.secondaryColor || "#33C3FF");
      setLogoPreview(data.branding?.logoUrl || "");
      setMenuImagePreview(data.branding?.menuImage || "");
      setAboutTitle(data.about?.title || "About Us");
      setAboutContent(data.about?.content || "");
      setSupportEmail(data.support?.email || "");
      setSupportPhone(data.support?.phone || "");
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
      setTerms(data.policies?.terms || "");
      setPrivacy(data.policies?.privacy || "");
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // First upload logo if there's a new file
      let logoUrl = logoPreview;
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const uploadRes = await api.post('/api/restaurant/upload-logo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        logoUrl = uploadRes.data.logoUrl;
      }

      // Upload menu image if there's a new file
      let menuImage = menuImagePreview;
      if (menuImageFile) {
        const formData = new FormData();
        formData.append('menuImage', menuImageFile);
        
        const uploadRes = await api.post('/api/restaurant/upload-menu-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        menuImage = uploadRes.data.menuImageUrl;
      }

      const payload = {
        restaurantName,
        description,
        phone,
        address,
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl,
          menuImage,
        },
        about: { title: aboutTitle, content: aboutContent },
        support: { email: supportEmail, phone: supportPhone },
        faqs,
        policies: { terms, privacy },
      };

      const res = await api.put("/api/restaurant", payload);

      updateSettings(res.data);
      toast.showToast({ message: "Settings saved", type: "success" });
      
      // Clear the file state after successful save
      setLogoFile(null);
      setMenuImageFile(null);
    } catch (error) {
      toast.showToast({ message: "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const triggerLogoUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <PageMeta
        title="Settings | Restaurant Admin"
        description="Manage restaurant branding, language and notifications"
      />
      <PageBreadcrumb pageTitle="Settings" />

      {/* Main Grid - 2 Columns */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        
        {/* Column 1 - Restaurant Info + Policies */}
        <div className="space-y-4">
          {/* Restaurant Information Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Restaurant Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="lg:col-span-1">
                <Label>Restaurant Name</Label>
                <Input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>
              <div className="lg:col-span-1">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="lg:col-span-2">
                <Label>Description</Label>
                <TextArea
                  rows={3}
                  value={description}
                  onChange={setDescription}
                />
              </div>
              <div className="lg:col-span-2">
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Policies Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Policies</h3>
            </div>
            <div className="space-y-5">
              <div>
                <Label>Terms of Service</Label>
                <TextArea rows={11} value={terms} onChange={setTerms} />
              </div>
              <div>
                <Label>Privacy Policy</Label>
                <TextArea rows={11} value={privacy} onChange={setPrivacy} />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 - About & Support + Branding + Notifications */}
        <div className="space-y-4">
          {/* About & Support Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                About & Support
              </h3>
            </div>
            <div className="space-y-5">
              <div>
                <Label>About Title</Label>
                <Input value={aboutTitle} onChange={(e)=>setAboutTitle(e.target.value)} />
              </div>
              <div>
                <Label>About Content</Label>
                <TextArea rows={4} value={aboutContent} onChange={setAboutContent} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Support Email</Label>
                  <Input value={supportEmail} onChange={(e)=>setSupportEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Support Phone</Label>
                  <Input value={supportPhone} onChange={(e)=>setSupportPhone(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Branding Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Branding
              </h3>
            </div>
            <div className="space-y-5">
              {/* Colors Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-gray-200 bg-transparent p-0.5 cursor-pointer dark:border-gray-800"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Reward Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-gray-200 bg-transparent p-0.5 cursor-pointer dark:border-gray-800"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Recommended:</span>
                    <button
                      type="button"
                      onClick={() => setSecondaryColor("#F56E00")}
                      className="flex items-center px-2 py-1 ml-1 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                      title="Apply recommended color"
                    >
                      #F56E00
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <Label>Logo</Label>
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
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    {logoPreview ? "Change Logo" : "Upload Logo"}
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
              </div>

              {/* Menu Image Upload */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <Label>Menu Image (for Chatbot)</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Upload an image of your menu for the chatbot to display
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {menuImagePreview ? (
                      <img src={menuImagePreview} alt="Menu preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => menuImageInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    {menuImagePreview ? "Change Image" : "Upload Image"}
                  </button>
                  <input
                    ref={menuImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.type.startsWith("image/")) {
                        setMenuImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setMenuImagePreview(String(reader.result || ""));
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Notifications
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Checkbox label="New Order Alerts" checked={notifyNewOrder} onChange={setNotifyNewOrder} />
                <Checkbox label="Review Notifications" checked={notifyReview} onChange={setNotifyReview} />
              </div>
              <div className="space-y-3">
                <Checkbox label="Daily Sales Reports" checked={notifyDailySales} onChange={setNotifyDailySales} />
                <Checkbox label="Low Stock Alerts" checked={notifyLowStock} onChange={setNotifyLowStock} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs Section - Full Width */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">FAQs</h3>
          </div>
          <Button size="sm" onClick={()=> setFaqs([...faqs, { question: "", answer: "" }])}>
            + Add FAQ
          </Button>
        </div>
        
        {faqs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No FAQs added yet. Click "Add FAQ" to create one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Question {idx + 1}</Label>
                    <Input value={faq.question} onChange={(e)=>{
                      const next=[...faqs]; next[idx]={...next[idx], question:e.target.value}; setFaqs(next);
                    }} placeholder="Enter the question..." />
                  </div>
                  <div>
                    <Label>Answer</Label>
                    <Input value={faq.answer} onChange={(e)=>{
                      const next=[...faqs]; next[idx]={...next[idx], answer:e.target.value}; setFaqs(next);
                    }} placeholder="Enter the answer..." />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={()=>{ const next=[...faqs]; next.splice(idx,1); setFaqs(next); }}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Actions */}
      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button variant="outline" disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </>
  );
}
