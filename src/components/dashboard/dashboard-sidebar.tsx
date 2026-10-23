import Link from "next/link";

import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { dashboardConfigs, type DashboardArea } from "@/config/dashboard-nav";

// Fixed sidebar for tablet and desktop (hidden on phones, which use the drawer).
// - md (tablet): narrow icon rail, so content keeps most of the width
// - lg (desktop): full width with labels
export function DashboardSidebar({ area }: { area: DashboardArea }) {
  const config = dashboardConfigs[area];
  const AreaIcon = config.icon;

  return (
    <aside className="sticky top-0 hidden h-svh w-16 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex lg:w-64">
      <div className="flex h-14 items-center justify-center border-b px-3 lg:justify-start">
        <Link
          href={config.homeHref}
          className="flex items-center gap-2 rounded-md font-semibold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <AreaIcon className="size-4.5" aria-hidden="true" />
          </span>
          <span className="sr-only lg:not-sr-only">{config.label}</span>
        </Link>
      </div>
      <nav aria-label={config.label} className="flex-1 overflow-y-auto p-2 lg:p-3">
        <DashboardNavLinks area={area} variant="responsive" />
      </nav>
    </aside>
  );
}
