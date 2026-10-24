import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileDashboardNavigation } from "@/components/dashboard/mobile-dashboard-navigation";
import { UserMenu } from "@/components/dashboard/user-menu";
import { PreviewNotice } from "@/components/shared/preview-notice";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { dashboardConfigs, type DashboardArea } from "@/config/dashboard-nav";

// One shell for all three dashboards; the `area` prop picks the navigation.
// Server Component: only the nav links (active state), drawer and theme menu
// are client components.
//
// Phone:   top bar with a menu button → drawer
// Tablet:  icon rail sidebar
// Desktop: full sidebar with labels
export function DashboardShell({
  area,
  children,
}: {
  area: DashboardArea;
  children: React.ReactNode;
}) {
  const config = dashboardConfigs[area];

  return (
    <div className="flex min-h-svh flex-1">
      <DashboardSidebar area={area} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-6">
          <MobileDashboardNavigation area={area} />
          <p className="truncate text-sm font-medium md:hidden">{config.label}</p>
          <div className="ml-auto flex items-center gap-1">
            {/* Reads the session: streams in after the static shell. */}
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
            <ThemeToggle />
            <Link
              href="/"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              <span className="hidden sm:inline">Back to site</span>
              <span className="sr-only sm:hidden">Back to site</span>
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8"
        >
          <PreviewNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
