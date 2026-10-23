import { DashboardPagePreview } from "@/features/dashboards/components/dashboard-page-preview";
import { dashboardPageMetadata } from "@/features/dashboards/metadata";

const href = "/dashboard/meal-plans";

export const metadata = dashboardPageMetadata("customer", href);

export default function Page() {
  return <DashboardPagePreview area="customer" href={href} />;
}
