import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  // Usually a "Try again" button wired to the error boundary's retry().
  action?: React.ReactNode;
  className?: string;
};

// User-friendly error message. Never pass raw error messages or stack traces
// here: they can leak internal details. Log those on the server instead.
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If the problem continues, come back later.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-lg bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
