import { PlannedBadge } from "@/components/shared/planned-badge";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import type { Feature } from "@/features/marketing/content";

export function FeatureCard({
  feature,
  showStatus = true,
}: {
  feature: Feature;
  showStatus?: boolean;
}) {
  const Icon = feature.icon;

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          {showStatus ? <PlannedBadge /> : null}
        </div>
        {/* A real h3 keeps heading order correct under each section's h2
            (shadcn's CardTitle renders a div). */}
        <h3 className="mt-3 font-heading text-base leading-snug font-medium">
          {feature.title}
        </h3>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
