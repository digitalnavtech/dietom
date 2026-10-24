import Link from "next/link";
import { BadgeCheck, Ban, ShieldAlert } from "lucide-react";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { dashboardConfigs } from "@/config/dashboard-nav";
import type { ProtectedArea } from "@/lib/auth/area-access";

const content = {
  inactive: {
    icon: Ban,
    title: "This account is not active",
    description:
      "Your account has been suspended or closed, so dashboards are unavailable. Contact support if you think this is a mistake.",
  },
  forbidden: {
    icon: ShieldAlert,
    title: "You don't have access to this area",
    description: "Your account doesn't include the role this dashboard requires.",
  },
  unverified_dietitian: {
    icon: BadgeCheck,
    title: "Verification pending",
    description:
      "Dietitian tools unlock after your professional verification is approved. Verification applications open in a later release.",
  },
} as const;

export function AccessDenied({
  reason,
  area,
}: {
  reason: keyof typeof content;
  area: ProtectedArea;
}) {
  const { icon, title, description } = content[reason];
  return (
    <div className="space-y-6">
      <h1 className="sr-only">{dashboardConfigs[area].label}: access denied</h1>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            {reason === "inactive" ? null : (
              <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
                Go to my dashboard
              </Link>
            )}
            <SignOutButton variant={reason === "inactive" ? "default" : "ghost"} />
          </div>
        }
      />
    </div>
  );
}
