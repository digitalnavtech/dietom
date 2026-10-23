"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  dashboardConfigs,
  isNavItemActive,
  type DashboardArea,
} from "@/config/dashboard-nav";
import { cn } from "@/lib/utils";

type DashboardNavLinksProps = {
  // An area key instead of the nav array: icons are React components, and
  // components can't be passed from a Server Component to a Client Component.
  // So the client looks the config up itself.
  area: DashboardArea;
  // "rail" = icons only (tablet). Labels stay available to screen readers.
  variant?: "full" | "rail" | "responsive";
  onNavigate?: () => void;
};

// Shared by the desktop sidebar and the mobile drawer so both always match.
export function DashboardNavLinks({
  area,
  variant = "full",
  onNavigate,
}: DashboardNavLinksProps) {
  const pathname = usePathname();
  const config = dashboardConfigs[area];

  // responsive: icon rail at md, full labels from lg.
  const labelClass =
    variant === "rail"
      ? "sr-only"
      : variant === "responsive"
        ? "sr-only lg:not-sr-only"
        : undefined;
  const linkLayout =
    variant === "rail"
      ? "justify-center px-0"
      : variant === "responsive"
        ? "justify-center px-0 lg:justify-start lg:px-3"
        : "px-3";

  return (
    <ul className="flex flex-col gap-1">
      {config.nav.map((item) => {
        const active = isNavItemActive(pathname, item.href, config.homeHref);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={variant === "full" ? undefined : item.title}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                linkLayout,
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden="true" />
              <span className={labelClass}>{item.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
