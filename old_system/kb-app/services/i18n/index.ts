import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import translationEn from "./locales/en/translation.json";
import translationSv from "./locales/sv/translation.json";

const resources = {
  en: { translation: translationEn },
  sv: { translation: translationSv },
};

const LANGUAGE_KEY = "language";

// (Removed top-level locale detection and i18n initialization. Use only the async initI18n function below.)

export const initI18n = async () => {
  // Get device locale using expo-localization v16+
  const locales = Localization.getLocales?.();
  let deviceLocale: string = "en";
  if (locales && locales.length > 0 && locales[0].languageCode) {
    deviceLocale = locales[0].languageCode;
  }
  const supportedLanguages = Object.keys(resources);
  const languageToUse = supportedLanguages.includes(deviceLocale)
    ? deviceLocale
    : "en";

  await i18n.use(initReactI18next).init({
    resources,
    lng: "sv",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
  return i18n;
};

export const setLanguage = async (lang: string) => {
  await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};
