import { Menu } from "lucide-react";

import { LanguageTag } from "@/app/components/LanguageTag";
import { useI18n } from "@/i18n/useI18n";
import { NotificationBellDropdown } from "@/app/components/NotificationBellDropdown";
import { UserAccountDropdown } from "@/app/components/UserAccountDropdown";
import { Button } from "@/shared/ui/button";

type TopbarProps = {
  onOpenSidebar: () => void;
};

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenSidebar}
            aria-label={t("topbar.openNavigation")}
          >
            <Menu />
          </Button>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t("topbar.title")}
            </p>
            <p className="text-sm font-medium text-foreground">
              {t("topbar.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageTag />
          <NotificationBellDropdown />
          <UserAccountDropdown />
        </div>
      </div>
    </header>
  );
}
