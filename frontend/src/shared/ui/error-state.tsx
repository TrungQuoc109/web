import { TriangleAlert } from "lucide-react";

import { Button } from "@/shared/ui/button";

type ErrorStateProps = {
  title: string;
  description: string;
  onRetry: () => void;
};

export function ErrorState({
  title,
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="rounded-[2rem] border border-dashed border-border bg-background/80 px-8 py-16 text-center shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="rounded-3xl border border-border bg-secondary/70 p-4">
          <TriangleAlert />
        </div>
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </section>
  );
}

