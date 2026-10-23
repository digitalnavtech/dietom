import { timestamp } from "drizzle-orm/pg-core";

// Shared timestamp columns. `updated_at` is maintained by a database trigger
// (see the security migration), so it stays correct even for writes that don't
// go through Drizzle.
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
