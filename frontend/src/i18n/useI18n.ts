import { useMemo } from "react";

import {
  getCurrentLanguage,
  getLanguageLocale,
  useLanguageStore,
  type AppLanguage,
} from "@/i18n/languageStore";
import { translate } from "@/i18n/messages";

export function useI18n() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return useMemo(
    () => ({
      language,
      locale: getLanguageLocale(language),
      setLanguage,
      t: (key: string, params?: Record<string, string | number>) =>
        translate(language, key, params),
    }),
    [language, setLanguage]
  );
}

export function getCurrentTranslation(
  key: string,
  params?: Record<string, string | number>
) {
  return translate(getCurrentLanguage(), key, params);
}

export function getLanguageLabel(language: AppLanguage) {
  return language === "vi" ? "Tiếng Việt" : "English";
}
