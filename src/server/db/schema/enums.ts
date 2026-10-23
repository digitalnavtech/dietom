import { pgEnum } from "drizzle-orm/pg-core";

// Postgres enums: the database itself rejects any value not listed here.
// Adding a value later is a simple migration; removing one is not, so add carefully.

export const appRole = pgEnum("app_role", [
  "customer",
  "dietitian",
  "admin",
  "super_admin",
]);

export const accountStatus = pgEnum("account_status", [
  "active",
  "suspended",
  "deleted",
]);

export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const organizationType = pgEnum("organization_type", ["solo", "clinic"]);

export const organizationMemberRole = pgEnum("organization_member_role", [
  "owner",
  "dietitian",
  "assistant",
]);

export const relationshipStatus = pgEnum("relationship_status", [
  "invited",
  "active",
  "ended",
  "declined",
]);

// What a client allows a dietitian to do. Each scope is granted and revoked separately.
export const consentScope = pgEnum("consent_scope", [
  "profile.read",
  "diary.read",
  "plans.write",
]);
