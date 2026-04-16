import { AlertTriangle, RefreshCcw } from "lucide-react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

import { Button } from "@/shared/ui/button";

export function RouteErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";
  const description = isRouteErrorResponse(error)
    ? typeof error.data === "string" && error.data.trim().length > 0
      ? error.data
      : "The requested page could not be loaded."
    : error instanceof Error
      ? error.message
      : "An unexpected application error interrupted this route.";

  return (
    <div className="grid min-h-dvh place-items-center bg-[linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,0.72))] p-6">
      <section className="w-full max-w-xl rounded-[2rem] border border-border bg-background/95 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-border bg-secondary/60 p-3">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Route error
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCcw className="size-4" />
            Reload page
          </Button>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
