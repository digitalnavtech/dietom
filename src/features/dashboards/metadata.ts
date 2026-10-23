import type { Metadata } from "next";

import {
  dashboardConfigs,
  getDashboardPage,
  type DashboardArea,
} from "@/config/dashboard-nav";

// Page <title> from the nav config, e.g. "Diet tracker · Customer dashboard | Dietom".
export function dashboardPageMetadata(
  area: DashboardArea,
  href: string,
): Metadata {
  const page = getDashboardPage(area, href);
  const label = dashboardConfigs[area].label;
  return {
    title: page.href === dashboardConfigs[area].homeHref ? label : `${page.title} · ${label}`,
    description: page.description,
  };
}

// Applied in each dashboard layout. Preview pages must not appear in search
// results. robots.txt also disallows these paths.
export const previewRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};
