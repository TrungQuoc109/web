import { useEffect } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useToastStore } from "@/shared/lib/toast-store";
import { Button } from "@/shared/ui/button";

const variantStyles = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-border bg-background text-foreground",
} as const;

const variantIcons = {
  error: TriangleAlert,
  success: CheckCircle2,
  info: Info,
} as const;

export function Toaster() {
  const items = useToastStore((state) => state.items);
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    if (items.length === 0) return;

    const timers = items.map((item) =>
      window.setTimeout(() => dismiss(item.id), 4000)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismiss, items]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {items.map((item) => {
        const Icon = variantIcons[item.variant];

        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              variantStyles[item.variant]
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm opacity-90">{item.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
