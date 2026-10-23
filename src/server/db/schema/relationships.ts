import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { consentScope, relationshipStatus } from "./enums";
import { profiles } from "./identity";
import { organizations } from "./organizations";

// client_relationships: "this dietitian (in this organization) works with this
// client". A dietitian sees nothing about a client until the relationship is
// active AND the client has granted a consent scope (see `consents`).
export const clientRelationships = pgTable(
  "client_relationships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    dietitianUserId: uuid("dietitian_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    clientUserId: uuid("client_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: relationshipStatus("status").notNull().default("invited"),
    invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    check(
      "client_relationships_not_self",
      sql`${t.dietitianUserId} <> ${t.clientUserId}`,
    ),
    check(
      "client_relationships_active_has_start",
      sql`${t.status} <> 'active' or ${t.startedAt} is not null`,
    ),
    // At most one open (invited or active) relationship per dietitian/client pair.
    uniqueIndex("client_relationships_open_pair_unique")
      .on(t.dietitianUserId, t.clientUserId)
      .where(sql`${t.status} in ('invited', 'active')`),
    // Lets consents reference (id, client) together, guaranteeing a consent's
    // client is the relationship's client.
    unique("client_relationships_id_client_unique").on(t.id, t.clientUserId),
    index("client_relationships_client_idx").on(t.clientUserId),
    index("client_relationships_dietitian_idx").on(t.dietitianUserId, t.status),
    index("client_relationships_organization_idx").on(t.organizationId),
  ],
).enableRLS();

// consents: what the client allowed, when, and under which consent wording.
// Revoking sets revoked_at (rows are never deleted, which keeps a history).
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    relationshipId: uuid("relationship_id").notNull(),
    clientUserId: uuid("client_user_id").notNull(),
    scope: consentScope("scope").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    // Which version of the consent text the client agreed to, e.g. "2026-10-v1".
    consentTextVersion: text("consent_text_version").notNull(),
  },
  (t) => [
    foreignKey({
      name: "consents_relationship_client_fk",
      columns: [t.relationshipId, t.clientUserId],
      foreignColumns: [clientRelationships.id, clientRelationships.clientUserId],
    }).onDelete("cascade"),
    // Only one un-revoked consent per scope per relationship.
    uniqueIndex("consents_active_scope_unique")
      .on(t.relationshipId, t.scope)
      .where(sql`${t.revokedAt} is null`),
    // Covers the foreign key (the partial unique index above can't serve
    // cascade deletes, because it skips revoked rows).
    index("consents_relationship_idx").on(t.relationshipId),
    index("consents_client_idx").on(t.clientUserId),
    check(
      "consents_revoked_after_granted",
      sql`${t.revokedAt} is null or ${t.revokedAt} >= ${t.grantedAt}`,
    ),
  ],
).enableRLS();
