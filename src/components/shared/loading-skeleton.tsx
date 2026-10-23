import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  variant?: "lines" | "cards" | "table";
  count?: number;
  label?: string;
  className?: string;
};

// Placeholder shapes shown while content streams in (e.g. as a Suspense
// fallback). The visual blocks are hidden from screen readers; one status
// message announces the loading state instead.
export function LoadingSkeleton({
  variant = "lines",
  count = 3,
  label = "Loading content",
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <div role="status" className={cn("w-full", className)}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        {variant === "lines" ? (
          <div className="space-y-2.5">
            {items.map((index) => (
              <Skeleton
                key={index}
                className={cn("h-4", index === count - 1 ? "w-2/3" : "w-full")}
              />
            ))}
          </div>
        ) : null}

        {variant === "cards" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((index) => (
              <div key={index} className="space-y-3 rounded-xl border p-4">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        ) : null}

        {variant === "table" ? (
          <div className="space-y-2 rounded-xl border p-4">
            <Skeleton className="h-5 w-full" />
            {items.map((index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
