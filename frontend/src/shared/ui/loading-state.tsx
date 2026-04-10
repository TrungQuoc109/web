import { Skeleton } from "@/shared/ui/skeleton";

type LoadingStateProps = {
  title: string;
  description: string;
  statCount?: number;
  bodyClassName?: string;
};

export function LoadingState({
  title,
  description,
  statCount = 3,
  bodyClassName = "h-[28rem]",
}: LoadingStateProps) {
  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Workspace
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: statCount }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-3xl border border-border shadow-sm" />
        ))}
      </div>

      <Skeleton className={`${bodyClassName} rounded-[2rem] border border-border shadow-sm`} />
    </section>
  );
}

