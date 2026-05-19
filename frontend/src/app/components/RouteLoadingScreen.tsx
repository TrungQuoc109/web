import { useI18n } from "@/i18n/useI18n";

export function RouteLoadingScreen() {
  const { t } = useI18n();

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="text-sm text-muted-foreground">{t("common.loadingPage")}</div>
    </div>
  );
}
