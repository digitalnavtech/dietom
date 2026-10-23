import { Check } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getDashboardPage,
  type DashboardArea,
} from "@/config/dashboard-nav";

// Generic preview for a dashboard section: title, description, an honest empty
// state and the list of what is planned. No invented names, payments or metrics.
export function DashboardPagePreview({
  area,
  href,
}: {
  area: DashboardArea;
  href: string;
}) {
  const page = getDashboardPage(area, href);

  return (
    <>
      <DashboardHeader title={page.title} description={page.description} />

      <EmptyState
        icon={page.icon}
        title="Nothing to show yet"
        description="This section will display live data once accounts and the database are connected in a later step."
      />

      <section aria-labelledby="planned-title" className="rounded-xl border p-5">
        <h2 id="planned-title" className="font-heading text-base font-semibold">
          Planned for this page
        </h2>
        <ul className="mt-3 space-y-2">
          {page.planned.map((entry) => (
            <li key={entry} className="flex gap-2 text-sm text-muted-foreground">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {entry}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
