import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { timestamps } from "./columns";
import { accountStatus, appRole, verificationStatus } from "./enums";

// profiles: our app data for each Supabase Auth user (auth.users holds the login).
// Named "profiles" rather than "users" to avoid confusion with auth.users.
// Email is deliberately NOT copied here: it stays in auth.users, so there is
// one place to keep it correct and one fewer copy of personal data.
// A row is created automatically by the on-signup trigger.
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    fullName: text("full_name"),
    phone: text("phone"),
    country: text("country").notNull().default("IN"),
    locale: text("locale").notNull().default("en-IN"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    status: accountStatus("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    check("profiles_full_name_length", sql`char_length(${t.fullName}) <= 120`),
    check("profiles_phone_format", sql`${t.phone} ~ '^\\+[1-9][0-9]{6,14}$'`),
    check("profiles_country_format", sql`${t.country} ~ '^[A-Z]{2}$'`),
  ],
).enableRLS();

// user_roles: one row per role a user holds (a user can have several).
// Only the server can write here. The signup trigger adds "customer" and nothing
// else, so public registration can never grant admin or super_admin.
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: appRole("role").notNull(),
    // Who granted it (null = system, e.g. signup). Kept if the granter is deleted.
    grantedBy: uuid("granted_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "user_roles_pkey", columns: [t.userId, t.role] }),
    // Fast "who are the admins?" lookups.
    index("user_roles_role_idx").on(t.role),
    index("user_roles_granted_by_idx").on(t.grantedBy),
  ],
).enableRLS();

// dietitian_profiles: professional details + verification state.
// Restricted practitioner features require verification_status = 'approved'.
export const dietitianProfiles = pgTable(
  "dietitian_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    registrationBody: text("registration_body"),
    registrationNumber: text("registration_number"),
    qualifications: text("qualifications"),
    bio: text("bio"),
    verificationStatus: verificationStatus("verification_status")
      .notNull()
      .default("pending"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    // Shown to the applicant when rejected/suspended. No sensitive notes here.
    decisionReason: text("decision_reason"),
    ...timestamps,
  },
  (t) => [
    // The same registration can't be claimed by two accounts.
    uniqueIndex("dietitian_profiles_registration_unique")
      .on(t.registrationBody, t.registrationNumber)
      .where(sql`${t.registrationNumber} is not null`),
    index("dietitian_profiles_status_idx").on(t.verificationStatus),
    index("dietitian_profiles_verified_by_idx").on(t.verifiedBy),
    check("dietitian_profiles_bio_length", sql`char_length(${t.bio}) <= 2000`),
    // An approved profile must record when it was approved.
    check(
      "dietitian_profiles_approved_has_date",
      sql`${t.verificationStatus} <> 'approved' or ${t.verifiedAt} is not null`,
    ),
  ],
).enableRLS();
