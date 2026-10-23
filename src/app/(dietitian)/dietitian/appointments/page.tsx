import { DashboardPagePreview } from "@/features/dashboards/components/dashboard-page-preview";
import { dashboardPageMetadata } from "@/features/dashboards/metadata";

const href = "/dietitian/appointments";

export const metadata = dashboardPageMetadata("dietitian", href);

export default function Page() {
  return <DashboardPagePreview area="dietitian" href={href} />;
}
