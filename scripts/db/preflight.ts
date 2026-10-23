// READ-ONLY pre-flight check for the database in DATABASE_URL.
// Usage: npm run db:preflight
//
// - Validates DATABASE_URL (never prints it)
// - Connects inside a READ ONLY transaction (cannot change anything)
// - Reports objects that would conflict with our migrations
// - Shows which migrations are already applied
import nextEnv from "@next/env";
import postgres from "postgres";

import { databaseUrlSchema, describeEnvIssues } from "../../src/server/env-schema.ts";

nextEnv.loadEnvConfig(process.cwd());

const OUR_TABLES = [
  "profiles",
  "user_roles",
  "dietitian_profiles",
  "organizations",
  "organization_members",
  "client_relationships",
  "consents",
  "audit_logs",
];
const OUR_TYPES = [
  "app_role",
  "account_status",
  "verification_status",
  "organization_type",
  "organization_member_role",
  "relationship_status",
  "consent_scope",
];

const parsed = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
if (!parsed.success) {
  console.error(`✗ DATABASE_URL is not usable:\n${describeEnvIssues(parsed.error, "DATABASE_URL")}`);
  process.exit(1);
}

const databaseUrl = parsed.data;
const url = new URL(databaseUrl);
// Safe description of the target: host type and port only, no credentials.
const hostKind = url.hostname.endsWith("pooler.supabase.com")
  ? "Supabase pooler"
  : url.hostname.endsWith(".supabase.co")
    ? "Supabase direct connection"
    : ["localhost", "127.0.0.1"].includes(url.hostname)
      ? "local database"
      : "other host";
console.log(`Target: ${hostKind}, port ${url.port || "5432"}`);

const sql = postgres(databaseUrl, {
  prepare: false,
  max: 1,
  connect_timeout: 10,
  ssl: hostKind === "local database" ? false : "require",
  onnotice: () => {},
});

// Errors from the driver can echo connection details; print only safe fields.
function safeError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown error";
  const code = (error as { code?: string }).code;
  const secret = [databaseUrl, url.password, url.username, url.hostname].filter(Boolean);
  let message = error.message;
  for (const value of secret) message = message.split(value).join("***");
  return code ? `${code}: ${message}` : message;
}

try {
  const report = await sql.begin("read only", async (tx) => {
    const [server] = await tx`select current_setting('server_version') as version, current_user as "user"`;
    const tables = await tx<{ name: string }[]>`
      select table_name as name from information_schema.tables
      where table_schema = 'public' order by table_name`;
    const types = await tx<{ name: string }[]>`
      select t.typname as name from pg_type t join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = any(${OUR_TYPES})`;
    const [privateSchema] = await tx`select exists(select 1 from pg_namespace where nspname = 'private') as exists`;
    const authTriggers = await tx<{ name: string }[]>`
      select tgname as name from pg_trigger
      where tgrelid = 'auth.users'::regclass and not tgisinternal order by tgname`;
    const [migrationsTable] = await tx`select to_regclass('drizzle.__drizzle_migrations') is not null as exists`;
    const applied = migrationsTable.exists
      ? await tx<{ hash: string; created_at: string }[]>`select hash, created_at from drizzle.__drizzle_migrations order by id`
      : [];
    return { server, tables, types, privateSchema, authTriggers, applied };
  });

  console.log(`✓ Connected (Postgres ${report.server.version}, role "${report.server.user}")`);
  const existing = report.tables.map((t) => t.name);
  console.log(`  public tables: ${existing.length ? existing.join(", ") : "(none)"}`);

  const conflicts = [
    ...OUR_TABLES.filter((name) => existing.includes(name)).map((name) => `table public.${name}`),
    ...report.types.map((t) => `type public.${t.name}`),
    ...(report.authTriggers.some((t) => t.name === "on_auth_user_created")
      ? ["trigger on_auth_user_created on auth.users"]
      : []),
  ];
  console.log(`  private schema already exists: ${report.privateSchema.exists}`);
  console.log(
    `  triggers on auth.users: ${report.authTriggers.length ? report.authTriggers.map((t) => t.name).join(", ") : "(none)"}`,
  );
  console.log(`  migrations already applied: ${report.applied.length}`);

  if (conflicts.length) {
    console.log(`✗ Conflicts with our migrations:\n${conflicts.map((c) => `  - ${c}`).join("\n")}`);
    process.exitCode = 1;
  } else if (report.applied.length === 0) {
    console.log("✓ No conflicts. The database is ready for the first migration.");
  }
} catch (error) {
  console.error(`✗ Connection or query failed: ${safeError(error)}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
