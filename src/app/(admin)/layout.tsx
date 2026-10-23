import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { previewRobots } from "@/features/dashboards/metadata";

// Route group "(admin)": its own layout, no effect on URLs.
// Step 2: public interface preview. No authentication or role check yet.
export const metadata: Metadata = { robots: previewRobots };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell area="admin">{children}</DashboardShell>;
}
