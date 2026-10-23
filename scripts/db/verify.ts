// READ-ONLY security verification of the database in DATABASE_URL.
// Usage: npm run db:verify
//
// Runs inside a READ ONLY transaction (Postgres rejects any write) and checks
// that what migrations 0000 + 0001 should have created is actually installed.
// Prints PASS/FAIL per check. Never prints credentials or row data.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import nextEnv from "@next/env";
import postgres from "postgres";

import { databaseUrlSchema, describeEnvIssues } from "../../src/server/env-schema.ts";

nextEnv.loadEnvConfig(process.cwd());

const TABLES = [
  "audit_logs",
  "client_relationships",
  "consents",
  "dietitian_profiles",
  "organization_members",
  "organizations",
  "profiles",
  "user_roles",
];

const EXPECTED_POLICIES = [
  "client_relationships.client_relationships_select_participant (SELECT)",
  "consents.consents_select_participant (SELECT)",
  "dietitian_profiles.dietitian_profiles_select_own (SELECT)",
  "organization_members.organization_members_select_member (SELECT)",
  "organizations.organizations_select_member (SELECT)",
  "profiles.profiles_select_consented_dietitian (SELECT)",
  "profiles.profiles_select_own (SELECT)",
  "profiles.profiles_update_own_active (UPDATE)",
  "user_roles.user_roles_select_own (SELECT)",
];

const EXPECTED_ENUMS: Record<string, string[]> = {
  account_status: ["active", "suspended", "deleted"],
  app_role: ["customer", "dietitian", "admin", "super_admin"],
  consent_scope: ["profile.read", "diary.read", "plans.write"],
  organization_member_role: ["owner", "dietitian", "assistant"],
  organization_type: ["solo", "clinic"],
  relationship_status: ["invited", "active", "ended", "declined"],
  verification_status: ["pending", "approved", "rejected", "suspended"],
};

// anon gets nothing; authenticated gets SELECT on every table except audit_logs.
const EXPECTED_TABLE_GRANTS = TABLES.filter((t) => t !== "audit_logs")
  .map((t) => `authenticated:${t}:SELECT`)
  .sort();
const EXPECTED_PROFILE_COLUMN_UPDATES = ["country", "full_name", "locale", "phone", "timezone"];

const parsed = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
if (!parsed.success) {
  console.error(`✗ DATABASE_URL is not usable:\n${describeEnvIssues(parsed.error, "DATABASE_URL")}`);
  process.exit(1);
}
const databaseUrl = parsed.data;

const sql = postgres(databaseUrl, {
  prepare: false,
  max: 1,
  connect_timeout: 10,
  ssl: /localhost|127\.0\.0\.1/.test(new URL(databaseUrl).hostname) ? false : "require",
  onnotice: () => {},
});

const results: Array<{ name: string; pass: boolean; details: string[] }> = [];
function check(name: string, problems: string[], okDetail: string) {
  results.push({ name, pass: problems.length === 0, details: problems.length ? problems : [okDetail] });
}
function diff(label: string, actual: string[], expected: string[]): string[] {
  const missing = expected.filter((x) => !actual.includes(x)).map((x) => `missing ${label}: ${x}`);
  const extra = actual.filter((x) => !expected.includes(x)).map((x) => `unexpected ${label}: ${x}`);
  return [...missing, ...extra];
}

function safeError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown error";
  const url = new URL(databaseUrl);
  let message = error.message;
  for (const secret of [databaseUrl, url.password, url.username, url.hostname].filter(Boolean)) {
    message = message.split(secret).join("***");
  }
  return message;
}

try {
  await sql.begin("read only", async (tx) => {
    // 1. RLS enabled ------------------------------------------------------------
    const rls = await tx<{ name: string; enabled: boolean }[]>`
      select c.relname as name, c.relrowsecurity as enabled
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relname = any(${TABLES})`;
    check(
      "1. RLS enabled on all 8 tables",
      [
        ...TABLES.filter((t) => !rls.some((r) => r.name === t)).map((t) => `table missing: ${t}`),
        ...rls.filter((r) => !r.enabled).map((r) => `RLS disabled: ${r.name}`),
      ],
      `${rls.filter((r) => r.enabled).length}/8 tables have RLS enabled`,
    );

    // 2. Policies -------------------------------------------------------------------
    const policies = await tx<{ id: string; roles: string[] }[]>`
      select tablename || '.' || policyname || ' (' || cmd || ')' as id, roles::text[] as roles
      from pg_policies where schemaname = 'public' and tablename = any(${TABLES})`;
    const policyIds = policies.map((p) => p.id).sort();
    check(
      "2. Expected RLS policies installed (and no others)",
      [
        ...diff("policy", policyIds, EXPECTED_POLICIES),
        ...policies
          .filter((p) => p.roles.join(",") !== "authenticated")
          .map((p) => `policy not limited to authenticated: ${p.id} -> ${p.roles.join(",")}`),
        ...(policyIds.some((id) => id.startsWith("audit_logs.")) ? ["audit_logs must have no policies"] : []),
      ],
      `${policyIds.length}/9 policies, all scoped to "authenticated"; audit_logs has none`,
    );

    // 3. Migrations recorded --------------------------------------------------------
    const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as {
      entries: Array<{ tag: string; when: number }>;
    };
    const exists = await tx<{ ok: boolean }[]>`select to_regclass('drizzle.__drizzle_migrations') is not null as ok`;
    const applied = exists[0]?.ok
      ? await tx<{ hash: string; created_at: string }[]>`select hash, created_at::text from drizzle.__drizzle_migrations order by id`
      : [];
    const problems3: string[] = [];
    if (!exists[0]?.ok) problems3.push("drizzle.__drizzle_migrations table not found");
    journal.entries.forEach((entry, index) => {
      const fileHash = createHash("sha256").update(readFileSync(`drizzle/${entry.tag}.sql`, "utf8")).digest("hex");
      const row = applied[index];
      if (!row) problems3.push(`not recorded: ${entry.tag}`);
      else if (row.hash !== fileHash) problems3.push(`hash differs from local file: ${entry.tag} (file changed after applying?)`);
    });
    if (applied.length > journal.entries.length) problems3.push(`${applied.length - journal.entries.length} unknown extra migration(s) recorded`);
    check(
      "3. Both Drizzle migrations recorded",
      problems3,
      `${applied.length}/${journal.entries.length} recorded; hashes match the committed files`,
    );

    // 4. Signup trigger ------------------------------------------------------------------
    const trigger = await tx<{ enabled: string; fn: string; secdef: boolean; config: string[] | null; timing: string }[]>`
      select t.tgenabled as enabled, n.nspname || '.' || p.proname as fn, p.prosecdef as secdef,
             p.proconfig as config,
             case when (t.tgtype & 2) <> 0 then 'BEFORE' else 'AFTER' end ||
             case when (t.tgtype & 4) <> 0 then ' INSERT' else '' end as timing
      from pg_trigger t
      join pg_proc p on p.oid = t.tgfoid
      join pg_namespace n on n.oid = p.pronamespace
      where t.tgrelid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created'`;
    const trg = trigger[0];
    check(
      "4. Signup trigger on auth.users",
      trg
        ? [
            ...(trg.enabled === "O" ? [] : [`trigger not enabled (state ${trg.enabled})`]),
            ...(trg.fn === "private.handle_new_user" ? [] : [`calls ${trg.fn}`]),
            ...(trg.timing === "AFTER INSERT" ? [] : [`timing is ${trg.timing}`]),
            ...(trg.secdef ? [] : ["function is not SECURITY DEFINER"]),
            ...(trg.config?.some((c) => c.startsWith("search_path=")) ? [] : ["function has no fixed search_path"]),
          ]
        : ["trigger on_auth_user_created not found"],
      "on_auth_user_created: enabled, AFTER INSERT → private.handle_new_user (SECURITY DEFINER, fixed search_path)",
    );

    // 5. Audit log append-only ---------------------------------------------------------------
    const auditTriggers = await tx<{ name: string; enabled: string }[]>`
      select tgname as name, tgenabled as enabled from pg_trigger
      where tgrelid = 'public.audit_logs'::regclass and not tgisinternal`;
    const auditGrants = await tx<{ grantee: string; privilege: string }[]>`
      select grantee, privilege_type as privilege from information_schema.role_table_grants
      where table_schema = 'public' and table_name = 'audit_logs' and grantee in ('anon', 'authenticated')`;
    const names = auditTriggers.map((t) => t.name);
    check(
      "5. audit_logs append-only",
      [
        ...["audit_logs_append_only", "audit_logs_no_truncate"]
          .filter((n) => !names.includes(n))
          .map((n) => `missing trigger: ${n}`),
        ...auditTriggers.filter((t) => t.enabled !== "O").map((t) => `trigger disabled: ${t.name}`),
        ...auditGrants.map((g) => `unexpected grant: ${g.privilege} to ${g.grantee}`),
      ],
      "UPDATE/DELETE + TRUNCATE blocked by triggers; no anon/authenticated privileges; no policies",
    );

    // 6. Grants + enums ----------------------------------------------------------------------------
    const tableGrants = await tx<{ id: string }[]>`
      select grantee || ':' || table_name || ':' || privilege_type as id
      from information_schema.role_table_grants
      where table_schema = 'public' and table_name = any(${TABLES}) and grantee in ('anon', 'authenticated')`;
    const columnUpdates = await tx<{ column: string }[]>`
      select column_name as column from information_schema.column_privileges
      where table_schema = 'public' and table_name = 'profiles'
        and grantee = 'authenticated' and privilege_type = 'UPDATE'`;
    const enums = await tx<{ name: string; values: string[] }[]>`
      select t.typname as name, array_agg(e.enumlabel order by e.enumsortorder)::text[] as values
      from pg_type t join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' group by t.typname`;
    const fnGrants = await tx<{ fn: string; grantee: string }[]>`
      select p.proname as fn, coalesce(g.rolname, 'PUBLIC') as grantee
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      left join pg_roles g on g.oid = a.grantee
      where n.nspname = 'private' and a.privilege_type = 'EXECUTE'
        and coalesce(g.rolname, 'PUBLIC') in ('PUBLIC', 'anon')`;
    const enumProblems = Object.entries(EXPECTED_ENUMS).flatMap(([name, values]) => {
      const found = enums.find((e) => e.name === name);
      if (!found) return [`missing enum: ${name}`];
      return found.values.join(",") === values.join(",") ? [] : [`enum ${name} values differ: ${found.values.join(",")}`];
    });
    // Trigger-only helpers (set_updated_at, prevent_audit_log_changes) keep the
    // default PUBLIC execute; they can't be called as normal functions.
    const callableByPublic = fnGrants.filter((g) =>
      ["handle_new_user", "has_role", "is_org_member", "is_relationship_dietitian", "has_client_access"].includes(g.fn),
    );
    check(
      "6. Grants and 7 enums",
      [
        ...diff("table grant", tableGrants.map((g) => g.id).sort(), EXPECTED_TABLE_GRANTS),
        ...diff("profiles UPDATE column", columnUpdates.map((c) => c.column).sort(), EXPECTED_PROFILE_COLUMN_UPDATES),
        ...enumProblems,
        ...callableByPublic.map((g) => `private.${g.fn} executable by ${g.grantee}`),
      ],
      `anon: no table access; authenticated: SELECT on 7 tables + UPDATE on 5 profile columns; private helpers not callable by anon/PUBLIC; ${Object.keys(EXPECTED_ENUMS).length}/7 enums with exact values`,
    );
  });
} catch (error) {
  console.error(`✗ Verification query failed: ${safeError(error)}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}

for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}`);
  for (const d of r.details) console.log(`      ${d}`);
}
const failed = results.filter((r) => !r.pass).length;
if (results.length) console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exitCode = 1;
