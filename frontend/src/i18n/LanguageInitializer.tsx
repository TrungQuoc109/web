import { useEffect } from "react";

import { useI18n } from "@/i18n/useI18n";

export function LanguageInitializer() {
  const { language } = useI18n();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
