// Pure authorization context (no imports), unit-tested in access.test.ts.
//
// Turns raw database rows into a small, trustworthy summary of what the
// current user is. Inputs come from OUR tables (profiles, user_roles,
// dietitian_profiles), never from cookies, JWT claims or user metadata.

// Must match the `app_role` Postgres enum (a test checks this).
export const APP_ROLES = ["customer", "dietitian", "admin", "super_admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type AccessInput = {
  userId: string;
  // null = no profile row (should not happen thanks to the signup trigger).
  profileStatus: string | null;
  roles: readonly string[];
  // null = the user has no dietitian_profiles row.
  dietitianVerificationStatus: string | null;
};

export type AccessContext = {
  userId: string;
  // Only "active" accounts get any roles at all.
  isActive: boolean;
  roles: AppRole[];
  // Dietitian role AND an approved verification. Required for client data.
  isVerifiedDietitian: boolean;
};

// Fails closed: a suspended, deleted or missing profile has no roles, and
// unknown role strings are dropped rather than trusted. Output order is fixed
// (APP_ROLES order) and duplicates collapse.
export function buildAccessContext(input: AccessInput): AccessContext {
  const isActive = input.profileStatus === "active";
  const roles = isActive ? APP_ROLES.filter((role) => input.roles.includes(role)) : [];

  return {
    userId: input.userId,
    isActive,
    roles,
    isVerifiedDietitian:
      roles.includes("dietitian") && input.dietitianVerificationStatus === "approved",
  };
}

export function hasRole(context: AccessContext, role: AppRole): boolean {
  return context.roles.includes(role);
}

export function hasAnyRole(context: AccessContext, roles: readonly AppRole[]): boolean {
  return roles.some((role) => context.roles.includes(role));
}
