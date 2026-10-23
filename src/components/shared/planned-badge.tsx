import { Badge } from "@/components/ui/badge";

// Used everywhere a feature is described but not built yet, so the UI never
// implies something works when it doesn't.
export function PlannedBadge({ label = "Planned" }: { label?: string }) {
  return (
    <Badge
      variant="outline"
      className="border-warm/40 bg-accent text-accent-foreground"
    >
      {label}
    </Badge>
  );
}
