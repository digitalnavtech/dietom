import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  label?: string;
  // Show the label visually, or keep it for screen readers only.
  showLabel?: boolean;
  className?: string;
};

export function LoadingSpinner({
  label = "Loading",
  showLabel = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      {/* The wrapper owns role="status", so the icon is decorative here. */}
      <Spinner role="presentation" aria-hidden="true" aria-label={undefined} />
      <span className={showLabel ? undefined : "sr-only"}>{label}</span>
    </span>
  );
}
