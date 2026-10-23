import { DashboardPagePreview } from "@/features/dashboards/components/dashboard-page-preview";
import { dashboardPageMetadata } from "@/features/dashboards/metadata";

const href = "/admin/users";

export const metadata = dashboardPageMetadata("admin", href);

export default function Page() {
  return <DashboardPagePreview area="admin" href={href} />;
}
