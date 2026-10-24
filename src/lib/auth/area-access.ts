// Pure authorization decision (type-only imports), unit-tested in area-access.test.ts.
//
// Answers: may this user enter this dashboard area? The AccessContext comes
// from the server (verified identity + roles/status from our database).
import type { AccessContext } from "../../server/auth/access.ts";

export type ProtectedArea = "customer" | "dietitian" | "admin";

export type AreaDecision =
  | { allowed: true }
  | { allowed: false; reason: "unauthenticated" | "inactive" | "forbidden" | "unverified_dietitian" };

export function decideAreaAccess(
  context: AccessContext | null,
  area: ProtectedArea,
): AreaDecision {
  if (!context) return { allowed: false, reason: "unauthenticated" };
  // Suspended / deleted / missing profile: no area at all.
  if (!context.isActive) return { allowed: false, reason: "inactive" };

  switch (area) {
    case "customer":
      return context.roles.includes("customer")
        ? { allowed: true }
        : { allowed: false, reason: "forbidden" };
    case "dietitian":
      if (!context.roles.includes("dietitian")) return { allowed: false, reason: "forbidden" };
      // Holding the role is not enough: the verification must be approved.
      return context.isVerifiedDietitian
        ? { allowed: true }
        : { allowed: false, reason: "unverified_dietitian" };
    case "admin":
      // super_admin can do everything an admin can.
      return context.roles.includes("admin") || context.roles.includes("super_admin")
        ? { allowed: true }
        : { allowed: false, reason: "forbidden" };
  }
}

// Optimistic check used by the proxy (no database): is this a protected path?
export const PROTECTED_PREFIXES = ["/dashboard", "/dietitian", "/admin"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
