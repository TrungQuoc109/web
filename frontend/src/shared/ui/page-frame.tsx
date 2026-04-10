type PageFrameProps = {
  title: string;
  description: string;
};

export function PageFrame({ title, description }: PageFrameProps) {
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3">
            <div className="h-3 w-28 rounded-full bg-secondary" />
            <div className="h-36 rounded-2xl bg-secondary/70" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-24 rounded-2xl bg-secondary/70" />
              <div className="h-24 rounded-2xl bg-secondary/70" />
              <div className="h-24 rounded-2xl bg-secondary/70" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="h-3 w-24 rounded-full bg-secondary" />
            <div className="h-20 rounded-2xl bg-secondary/70" />
            <div className="h-20 rounded-2xl bg-secondary/70" />
            <div className="h-20 rounded-2xl bg-secondary/70" />
          </div>
        </div>
      </div>
    </section>
  );
}

