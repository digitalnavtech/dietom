import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PlannedBadge } from "@/components/shared/planned-badge";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { dashboardConfigs, type DashboardArea } from "@/config/dashboard-nav";

const intro: Record<DashboardArea, string> = {
  customer:
    "Where individuals will track food, follow meal plans and manage their account.",
  dietitian:
    "Where verified dietitians will work with clients who have consented to share their data.",
  admin:
    "Where Dietom staff will manage users, verifications, the catalogue and payments.",
};

// Area home page: explains each section instead of showing invented numbers.
export function DashboardOverview({ area }: { area: DashboardArea }) {
  const config = dashboardConfigs[area];
  const sections = config.nav.filter((item) => item.href !== config.homeHref);

  return (
    <>
      <DashboardHeader title={config.label} description={intro[area]} />
      <section aria-labelledby="sections-title">
        <h2 id="sections-title" className="sr-only">
          Sections
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Card className="h-full transition-shadow group-hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <PlannedBadge />
                      </div>
                      <h3 className="mt-3 flex items-center gap-1.5 font-heading text-base font-medium">
                        {item.title}
                        <ArrowRight
                          className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </h3>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
