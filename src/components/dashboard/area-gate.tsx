import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/dashboard/access-denied";
import type { ProtectedArea } from "@/lib/auth/area-access";
import { dashboardConfigs } from "@/config/dashboard-nav";
import { getAreaAccess } from "@/server/auth/guards";

// Server-side gate rendered by EVERY dashboard page (not just the layout), so
// each page is protected on its own, including on client navigation and
// prefetch. Reads cookies: always render inside <Suspense>.
//
// - not signed in → redirect to /sign-in (back to this area afterwards)
// - signed in but not allowed → explain why; the page content is never rendered
export async function AreaGate({
  area,
  children,
}: {
  area: ProtectedArea;
  children: React.ReactNode;
}) {
  const { decision } = await getAreaAccess(area);

  if (decision.allowed) return <>{children}</>;
  if (decision.reason === "unauthenticated") {
    redirect(`/sign-in?next=${encodeURIComponent(dashboardConfigs[area].homeHref)}`);
  }
  return <AccessDenied reason={decision.reason} area={area} />;
}
