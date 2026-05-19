import type { AppLanguage } from "@/i18n/languageStore";
import { useI18n } from "@/i18n/useI18n";
import { cn } from "@/shared/lib/cn";

const languageOptions: Array<{ value: AppLanguage; shortLabel: string }> = [
  { value: "en", shortLabel: "EN" },
  { value: "vi", shortLabel: "VI" },
];

export function LanguageTag() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
      <span className="sr-only">{t("common.language")}</span>
      {languageOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          aria-label={
            option.value === "vi" ? t("common.vietnamese") : t("common.english")
          }
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] transition-colors",
            language === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}
