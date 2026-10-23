import { PlannedBadge } from "@/components/shared/planned-badge";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { dashboards } from "@/features/marketing/content";

// Explains the three planned dashboards. Route paths are shown as text (not
// links) because those pages don't exist yet.
export function DashboardsOverview() {
  return (
    <section
      id="dashboards"
      aria-labelledby="dashboards-title"
      className="scroll-mt-20 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="dashboards-title"
          eyebrow="How it fits together"
          title="Three dashboards, each with its own access rules"
          description="Every account sees only the dashboard its role allows. Role checks will run on the server, never just in the browser."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <Card key={dashboard.id} className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <PlannedBadge />
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-semibold">
                    {dashboard.title}
                  </h3>
                  <p className="text-xs font-medium text-primary">
                    {dashboard.audience}
                  </p>
                  <CardDescription className="mt-1">
                    {dashboard.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="text-xs font-medium text-muted-foreground">
                    Planned pages
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {dashboard.routes.map((route) => (
                      <li key={route.path}>
                        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
                          {route.path}
                        </code>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
