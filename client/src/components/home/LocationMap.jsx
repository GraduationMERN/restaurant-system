import React from "react";
import { useSettings } from "../../context/SettingContext";
import { useTranslation } from "react-i18next";

export default function LocationMap({ height = 280 }) {
    const { settings } = useSettings();
    const { i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const address = settings.address?.trim() || "";
    if (!address) return null;
    const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

    return (
        <div className={`mt-4 ${isRTL ? "rtl" : "ltr"}`}>
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <iframe
                    title="Location Map"
                    src={src}
                    width="100%"
                    height={height}
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen=""
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
        </div>
    );
}
