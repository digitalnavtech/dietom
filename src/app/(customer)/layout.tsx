import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { previewRobots } from "@/features/dashboards/metadata";

// Route group "(customer)": its own layout, no effect on URLs.
// Access is checked on the server by each page (AreaGate), not here: layouts
// don't re-run on every navigation, so they are not a reliable gate.
export const metadata: Metadata = { robots: previewRobots };

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell area="customer">{children}</DashboardShell>;
}
