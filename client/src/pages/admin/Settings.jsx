import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../../context/SettingContext";
import api from "../../api/axios";

export default function Settings() {

  const { settings, updateSettings } = useSettings();
  const [restaurantName, setRestaurantName] = useState(settings.restaurantName);
  const [description, setDescription] = useState(
    "Authentic Italian cuisine with a modern twist"
  );
  const [address, setAddress] = useState(
    "123 Main Street, City, State 12345"
  );
  const [phone, setPhone] = useState(settings.phone);

  const [primaryColor, setPrimaryColor] = useState(settings.color || "#FF5733");
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || "#33C3FF");
  const [logoPreview, setLogoPreview] = useState(settings.logo || "");
  const [logoFile, setLogoFile] = useState(null);
  const fileInputRef = useRef(null);


  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyReview, setNotifyReview] = useState(true);
  const [notifyDailySales, setNotifyDailySales] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(false);


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
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      const payload = {
        restaurantName,
        description,
        phone,
        address,
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: logoPreview
        }
      };

      const res = await api.put("/api/restaurant", payload);

      updateSettings(res.data);



    } catch (error) {
      console.error("Error saving settings", error);
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
                <Label>Reward Color</Label>
                <div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-10 rounded-md border border-gray-200 bg-transparent p-0 dark:border-gray-800"
                  />
                  <Input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                  </div>
                  <h2 className="mt-2 text-xs block auto  text-[#888]">Recommended <span className=" text-[#FFA500] select-text"> #FFA500</span></h2>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
