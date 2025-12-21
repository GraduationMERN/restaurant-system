import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ArabicLang from "./languages/ArabicLang.json"
import EnglishLang from "./languages/EnglishLang.json"

// Language resources with direction info
const resources = {
  en: {
    translation: EnglishLang
  },
  ar: {
    translation: ArabicLang
  }
};

// Get saved language or default to English
const savedLanguage = localStorage.getItem("language") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Apply direction on language change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem("language", lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

// Apply initial direction
document.documentElement.lang = savedLanguage;
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';

export default i18n;