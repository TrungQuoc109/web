import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppLanguage = "en" | "vi";

type LanguageState = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "pm-language",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function getCurrentLanguage(): AppLanguage {
  return useLanguageStore.getState().language;
}

export function getLanguageLocale(language: AppLanguage) {
  return language === "vi" ? "vi-VN" : "en-US";
}

export function getCurrentLocale() {
  return getLanguageLocale(getCurrentLanguage());
}
