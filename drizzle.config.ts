import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { databaseUrlSchema, describeEnvIssues } from "./src/server/env-schema";

// drizzle-kit runs outside Next.js, so load .env.local the same way Next does.
loadEnvConfig(process.cwd());

// Generating migrations is offline and needs no database. Only commands that
// connect (migrate, check against a DB) need a valid DATABASE_URL. They fail
// with a clear, value-free message when it's missing or still a placeholder.
function databaseUrl(): string {
  const result = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  if (!result.success) {
    throw new Error(`Cannot connect to the database:\n${describeEnvIssues(result.error, "DATABASE_URL")}`);
  }
  return result.data;
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  // Only manage our own schema. auth, storage, etc. belong to Supabase.
  schemaFilter: ["public"],
  dbCredentials: {
    get url() {
      return databaseUrl();
    },
  },
  // Ask before anything destructive (dropping columns/tables) in generated SQL.
  strict: true,
  verbose: true,
});
