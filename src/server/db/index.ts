import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "../env";
import * as schema from "./schema";

// ⚠ PRIVILEGED CONNECTION. DATABASE_URL logs in as the `postgres` role, which
// BYPASSES Row Level Security. Every function that uses `db` must check, in
// code, that the current user may do what it's about to do (Step 4 adds
// requireUser / requireRole / requireClientAccess for this). RLS still protects
// anything reached through the Supabase Data API with the publishable key.

export type Database = PostgresJsDatabase<typeof schema>;

// Reuse one client across hot reloads in development; otherwise every file
// save would open a new connection pool and exhaust the database's limit.
const globalForDb = globalThis as unknown as {
  dietomSql?: postgres.Sql;
  dietomDb?: Database;
};

function createDb(): Database {
  const sql =
    globalForDb.dietomSql ??
    postgres(getServerEnv().DATABASE_URL, {
      // Required by Supabase's transaction pooler (port 6543), harmless elsewhere.
      prepare: false,
      // Small pool: the Supabase pooler multiplexes connections for us.
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  if (process.env.NODE_ENV !== "production") globalForDb.dietomSql = sql;
  return drizzle(sql, { schema });
}

// Lazy: the connection is created on first use, not when this file is imported.
export function getDb(): Database {
  if (!globalForDb.dietomDb) globalForDb.dietomDb = createDb();
  return globalForDb.dietomDb;
}
