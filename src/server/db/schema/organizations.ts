import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { organizationMemberRole, organizationType } from "./enums";
import { profiles } from "./identity";

// organizations: the tenant boundary for professional data. Every dietitian
// gets a "solo" organization, so clinics later need no schema change.
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: organizationType("type").notNull().default("solo"),
    // RESTRICT: an organization must be handed over or closed before its owner
    // account can be hard-deleted.
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (t) => [
    index("organizations_owner_user_id_idx").on(t.ownerUserId),
    check("organizations_name_length", sql`char_length(${t.name}) between 1 and 120`),
  ],
).enableRLS();

export const organizationMembers = pgTable(
  "organization_members",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    memberRole: organizationMemberRole("member_role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      name: "organization_members_pkey",
      columns: [t.organizationId, t.userId],
    }),
    // "Which organizations is this user in?" (the PK covers lookups by organization).
    index("organization_members_user_id_idx").on(t.userId),
  ],
).enableRLS();
