import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// audit_logs: append-only record of sensitive actions (role changes,
// verification decisions, consent changes, admin access to personal data...).
//
// Deliberately NO foreign keys: the log must outlive the users and
// organizations it mentions, and a cascading delete would rewrite history.
// A trigger in the security migration blocks UPDATE and DELETE for everyone.
// Never store health details in `metadata`. Store ids and what changed.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    organizationId: uuid("organization_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    // Hash of the IP address, never the raw IP.
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
    index("audit_logs_actor_created_idx").on(t.actorUserId, t.createdAt),
    index("audit_logs_organization_created_idx").on(t.organizationId, t.createdAt),
  ],
).enableRLS();
