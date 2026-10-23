import { DashboardOverview } from "@/features/dashboards/components/dashboard-overview";
import { dashboardPageMetadata } from "@/features/dashboards/metadata";

export const metadata = dashboardPageMetadata("admin", "/admin");

export default function Page() {
  return <DashboardOverview area="admin" />;
}
