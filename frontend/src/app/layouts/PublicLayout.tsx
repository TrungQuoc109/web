import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,0.72))]">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Project Hub
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight text-foreground">
              Workspaces that keep projects clear and teams aligned.
            </h1>
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              A focused shell for planning, tasks, messages, and notifications,
              designed to keep momentum visible every day.
            </p>
          </div>
        </section>

        <section className="w-full">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

