import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  title: string;
  description?: string;
  // Page-level actions (buttons, filters) aligned to the right on desktop.
  actions?: React.ReactNode;
  className?: string;
};

// The heading block at the top of every dashboard page. It owns the page's h1.
export function DashboardHeader({
  title,
  description,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
