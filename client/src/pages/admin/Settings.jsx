import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Select from "../../components/form/Select";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Settings() {
  const [restaurantName, setRestaurantName] = useState("Bella Vista");
  const [description, setDescription] = useState(
    "Authentic Italian cuisine with a modern twist"
  );
  const [address, setAddress] = useState(
    "123 Main Street, City, State 12345"
  );
  const [phone, setPhone] = useState("+1 (555) 123-4567");

  const [primaryColor, setPrimaryColor] = useState("#465FFF");
  const { theme: appTheme, toggleTheme } = useTheme();
  const [theme, setTheme] = useState("light");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const fileInputRef = useRef(null);

  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [languages, setLanguages] = useState(["en", "ar", "es"]);

  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyReview, setNotifyReview] = useState(true);
  const [notifyDailySales, setNotifyDailySales] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(false);

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "ar", label: "Arabic" },
    { value: "es", label: "Spanish" },
  ];
  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  useEffect(() => {
    setTheme(appTheme);
  }, [appTheme]);

  const handleSave = () => {
    const payload = {
      restaurantName,
      description,
      address,
      phone,
      primaryColor,
      theme,
      defaultLanguage,
      languages,
      notifications: {
        newOrder: notifyNewOrder,
        review: notifyReview,
        dailySales: notifyDailySales,
        lowStock: notifyLowStock,
      },
      logo: logoFile,
    };
    console.log("Settings saved", payload);
    if (theme !== appTheme) {
      toggleTheme();
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Restaurant Information</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mt-5">
              <div className="lg:col-span-1">
                <Label>Restaurant Name</Label>
                <Input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
              </div>
              <div className="lg:col-span-1">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="lg:col-span-2">
                <Label>Description</Label>
                <TextArea rows={3} value={description} onChange={setDescription} />
              </div>
              <div className="lg:col-span-2">
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Language Settings</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mt-5">
              <div>
                <Label>Default Language</Label>
                <Select
                  options={languageOptions}
                  defaultValue={defaultLanguage}
                  onChange={(value) => setDefaultLanguage(value)}
                />
              </div>
              <div>
                <Label>Available Languages</Label>
                <div className="flex flex-col gap-3">
                  {languageOptions.map((opt) => (
                    <Checkbox
                      key={opt.value}
                      label={opt.label}
                      checked={languages.includes(opt.value)}
                      onChange={(checked) => {
                        setLanguages((prev) =>
                          checked
                            ? [...prev, opt.value]
                            : prev.filter((v) => v !== opt.value)
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Notifications</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mt-5">
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

          <div className="flex items-center gap-3">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Branding</h3>
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
                  <Input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-100 dark:bg-gray-800"></div>
                    )}
                  </div>
                  <Button variant="outline" onClick={triggerLogoUpload}>Upload New Logo</Button>
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
              <div>
                <Label>Theme</Label>
                <Select options={themeOptions} defaultValue={theme} onChange={setTheme} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
