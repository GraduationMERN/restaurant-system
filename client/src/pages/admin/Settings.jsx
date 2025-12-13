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
  const fileInputRef = useRef(null);

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
      const payload = {
        restaurantName,
        description,
        phone,
        address,
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: logoPreview,
        },
        about: { title: aboutTitle, content: aboutContent },
        support: { email: supportEmail, phone: supportPhone },
        faqs,
        policies: { terms, privacy },
      };

      const res = await api.put("/api/restaurant", payload);

      updateSettings(res.data);
      toast.showToast({ message: "Settings saved", type: "success" });
    } catch (error) {
      console.error("Error saving settings", error);
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Restaurant Information
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mt-5">
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

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Notifications
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mt-5">
              <div className="space-y-3">
                <Checkbox
                  label="New Order Alerts"
                  checked={notifyNewOrder}
                  onChange={setNotifyNewOrder}
                />
                <Checkbox
                  label="Review Notifications"
                  checked={notifyReview}
                  onChange={setNotifyReview}
                />
              </div>
              <div className="space-y-3">
                <Checkbox
                  label="Daily Sales Reports"
                  checked={notifyDailySales}
                  onChange={setNotifyDailySales}
                />
                <Checkbox
                  label="Low Stock Alerts"
                  checked={notifyLowStock}
                  onChange={setNotifyLowStock}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Policies</h3>
            <div className="mt-5 space-y-5">
              <div>
                <Label>Terms</Label>
                <TextArea rows={6} value={terms} onChange={setTerms} />
              </div>
              <div>
                <Label>Privacy</Label>
                <TextArea rows={6} value={privacy} onChange={setPrivacy} />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Branding
            </h3>
            <div className="mt-5 space-y-5">
              <div>
                <Label>Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 rounded-md border border-gray-200 bg-transparent p-0 dark:border-gray-800"
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
                <div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 rounded-md border border-gray-200 bg-transparent p-0 dark:border-gray-800"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <h2 className="text-xs text-[#888]">Recommended</h2>
                    <button
                      type="button"
                      onClick={() => setSecondaryColor("#F56E00")}
                      className="flex items-center px-1 py-1 text-xs font-medium text-[#FFA500] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                      title="Copy to Reward Color"
                    >
                      <span className="select-text">#F56E00</span>
                      <svg
                        className="w-3 h-3 mx-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100 dark:bg-gray-800"></div>
                    )}
                  </div>
                  <input
                    className="hover:bg-primary transition-all duration-300 px-7 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-primary"
                    type="button"
                    onClick={triggerLogoUpload}
                    value={logoPreview ? "Change Logo" : "Upload Logo"}
                  />

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
                        reader.onloadend = () =>
                          setLogoPreview(String(reader.result || ""));
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              About & Support
            </h3>
            <div className="mt-5 space-y-5">
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

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">FAQs</h3>
            <div className="mt-5 space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Question</Label>
                    <Input value={faq.question} onChange={(e)=>{
                      const next=[...faqs]; next[idx]={...next[idx], question:e.target.value}; setFaqs(next);
                    }} />
                  </div>
                  <div>
                    <Label>Answer</Label>
                    <Input value={faq.answer} onChange={(e)=>{
                      const next=[...faqs]; next[idx]={...next[idx], answer:e.target.value}; setFaqs(next);
                    }} />
                  </div>
                  <div className="lg:col-span-2 flex justify-end">
                    <Button variant="outline" onClick={()=>{
                      const next=[...faqs]; next.splice(idx,1); setFaqs(next);
                    }}>Remove</Button>
                  </div>
                </div>
              ))}
              <div>
                <Button onClick={()=> setFaqs([...faqs, { question: "", answer: "" }])}>Add FAQ</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </>
  );
}
