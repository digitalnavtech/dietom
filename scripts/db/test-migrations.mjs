// Applies Dietom's migrations to an in-memory Postgres 17 (PGlite) with a minimal
// Supabase stub, then checks constraints, triggers, grants and RLS policies.
// No Docker, no network, no real database is touched.
// Usage: npm run db:test
//
// The stub mimics only what our migrations rely on (auth.users, auth.uid(), the
// anon/authenticated/supabase_auth_admin roles and Supabase's default grants).
// It is a strong check of OUR SQL, not a full replica of Supabase.
// Add a test here whenever a migration adds a table, policy or trigger.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const migrationsDir = process.argv[2];
const journal = JSON.parse(readFileSync(join(migrationsDir, "meta/_journal.json"), "utf8"));

const db = new PGlite();
let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log(`  PASS  ${name}`); };
const bad = (name, detail) => { failed++; console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`); };
const expectEq = (name, actual, expected) =>
  JSON.stringify(actual) === JSON.stringify(expected) ? ok(name) : bad(name, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

// --- Minimal Supabase stub (roles, auth schema, default privileges) ---------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create role supabase_auth_admin nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb
  );
  -- Same logic as Supabase's auth.uid()
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant all on auth.users to supabase_auth_admin;
  -- Supabase grants everything on new public objects to these roles by default.
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`);

// --- Apply migrations exactly as drizzle-kit would (split on breakpoints) ----
console.log("Applying migrations");
for (const entry of journal.entries) {
  const sqlText = readFileSync(join(migrationsDir, `${entry.tag}.sql`), "utf8");
  const statements = sqlText.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  try {
    await db.transaction(async (tx) => { for (const s of statements) await tx.exec(s); });
    ok(`migration ${entry.tag} (${statements.length} statements)`);
  } catch (error) {
    bad(`migration ${entry.tag}`, error.message);
    process.exit(1);
  }
}

// --- Helpers ------------------------------------------------------------------
// Run fn as a signed-in user through the "Data API" path (role authenticated).
async function asUser(userId, fn) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
    return fn(tx);
  });
}
async function asAnon(fn) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role anon");
    return fn(tx);
  });
}
async function expectError(name, fn, pattern) {
  try {
    await fn();
    bad(name, "expected an error, but it succeeded");
  } catch (error) {
    if (pattern.test(error.message)) ok(name);
    else bad(name, `unexpected error: ${error.message}`);
  }
}
const count = async (tx, sql, params = []) => Number((await tx.query(`select count(*)::int as n from (${sql}) q`, params)).rows[0].n);

// --- Signup trigger ------------------------------------------------------------
console.log("Signup trigger");
const ids = {};
await db.exec("set role supabase_auth_admin");
for (const [name, meta] of [
  ["alice", { full_name: "  Alice Client  " }],
  ["bob", { full_name: "Bob Verified" }],
  ["carol", { full_name: "Carol Pending" }],
  ["dave", { full_name: "Dave Client" }],
  ["mallory", { full_name: "x".repeat(500), role: "super_admin", roles: ["admin"] }],
]) {
  const r = await db.query("insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id", [`${name}@example.test`, meta]);
  ids[name] = r.rows[0].id;
}
await db.exec("reset role");
expectEq("every signup gets a profile", await count(db, "select 1 from public.profiles"), 5);
expectEq("display name is trimmed", (await db.query("select full_name from public.profiles where id = $1", [ids.alice])).rows[0].full_name, "Alice Client");
expectEq("display name capped at 120 chars", (await db.query("select char_length(full_name) as n from public.profiles where id = $1", [ids.mallory])).rows[0].n, 120);
expectEq("metadata cannot grant admin roles (only 'customer')",
  (await db.query("select array_agg(role::text) as r from public.user_roles where user_id = $1", [ids.mallory])).rows[0].r, ["customer"]);

// --- Fixtures (as the server / postgres role) ------------------------------------
await db.query(`insert into public.user_roles (user_id, role) values ($1, 'dietitian'), ($2, 'dietitian')`, [ids.bob, ids.carol]);
await db.query(`insert into public.dietitian_profiles (user_id, verification_status, verified_at) values ($1, 'approved', now())`, [ids.bob]);
await db.query(`insert into public.dietitian_profiles (user_id) values ($1)`, [ids.carol]);
const orgBob = (await db.query(`insert into public.organizations (name, owner_user_id) values ('Bob Nutrition', $1) returning id`, [ids.bob])).rows[0].id;
const orgCarol = (await db.query(`insert into public.organizations (name, owner_user_id) values ('Carol Clinic', $1) returning id`, [ids.carol])).rows[0].id;
await db.query(`insert into public.organization_members values ($1, $2, 'owner'), ($3, $4, 'owner')`, [orgBob, ids.bob, orgCarol, ids.carol]);
const relAliceBob = (await db.query(`insert into public.client_relationships (organization_id, dietitian_user_id, client_user_id, status, started_at) values ($1, $2, $3, 'active', now()) returning id`, [orgBob, ids.bob, ids.alice])).rows[0].id;
const relDaveCarol = (await db.query(`insert into public.client_relationships (organization_id, dietitian_user_id, client_user_id, status, started_at) values ($1, $2, $3, 'active', now()) returning id`, [orgCarol, ids.carol, ids.dave])).rows[0].id;
await db.query(`insert into public.consents (relationship_id, client_user_id, scope, consent_text_version) values ($1, $2, 'profile.read', 'test-v1'), ($3, $4, 'profile.read', 'test-v1')`, [relAliceBob, ids.alice, relDaveCarol, ids.dave]);

// --- Constraints -------------------------------------------------------------------
console.log("Constraints");
await expectError("cannot open a 2nd relationship for the same pair",
  () => db.query(`insert into public.client_relationships (organization_id, dietitian_user_id, client_user_id) values ($1, $2, $3)`, [orgBob, ids.bob, ids.alice]), /client_relationships_open_pair_unique/);
await expectError("dietitian cannot be their own client",
  () => db.query(`insert into public.client_relationships (organization_id, dietitian_user_id, client_user_id) values ($1, $2, $2)`, [orgBob, ids.bob]), /client_relationships_not_self/);
await expectError("consent's client must match the relationship's client",
  () => db.query(`insert into public.consents (relationship_id, client_user_id, scope, consent_text_version) values ($1, $2, 'diary.read', 'v1')`, [relAliceBob, ids.dave]), /consents_relationship_client_fk/);
await expectError("only one active consent per scope",
  () => db.query(`insert into public.consents (relationship_id, client_user_id, scope, consent_text_version) values ($1, $2, 'profile.read', 'v1')`, [relAliceBob, ids.alice]), /consents_active_scope_unique/);
await expectError("approved dietitian must have verified_at",
  () => db.query(`update public.dietitian_profiles set verification_status = 'approved' where user_id = $1`, [ids.carol]), /dietitian_profiles_approved_has_date/);
await expectError("phone must be E.164",
  () => db.query(`update public.profiles set phone = '98765' where id = $1`, [ids.alice]), /profiles_phone_format/);
await expectError("org owner cannot be hard-deleted while owning an org",
  () => db.query(`delete from auth.users where id = $1`, [ids.bob]), /organizations_owner_user_id/);

// --- updated_at trigger -------------------------------------------------------------
const before = (await db.query("select updated_at from public.profiles where id = $1", [ids.dave])).rows[0].updated_at;
await new Promise((r) => setTimeout(r, 20));
await db.query("update public.profiles set locale = 'hi-IN' where id = $1", [ids.dave]);
const after = (await db.query("select updated_at from public.profiles where id = $1", [ids.dave])).rows[0].updated_at;
if (after > before) ok("updated_at changes on update");
else bad("updated_at changes on update");

// --- Anonymous visitors -----------------------------------------------------------------
console.log("Anonymous (publishable key, signed out)");
for (const table of ["profiles", "user_roles", "organizations", "client_relationships", "consents", "audit_logs"]) {
  await expectError(`anon cannot read ${table}`, () => asAnon((tx) => tx.query(`select * from public.${table}`)), /permission denied/);
}

// --- Signed-in users ------------------------------------------------------------------------
console.log("Profiles");
expectEq("alice sees only her own profile", await asUser(ids.alice, (tx) => count(tx, "select id from public.profiles")), 1);
expectEq("bob (approved + consent) sees himself + alice", await asUser(ids.bob, (tx) => count(tx, "select id from public.profiles")), 2);
expectEq("carol (NOT verified, has consent) sees only herself", await asUser(ids.carol, (tx) => count(tx, "select id from public.profiles")), 1);
expectEq("dave cannot see alice", await asUser(ids.dave, (tx) => count(tx, "select id from public.profiles where id = $1", [ids.alice])), 0);

console.log("Profile updates");
await asUser(ids.alice, (tx) => tx.query("update public.profiles set full_name = 'Alice C.' where id = $1", [ids.alice]));
expectEq("alice can edit her name", (await db.query("select full_name from public.profiles where id = $1", [ids.alice])).rows[0].full_name, "Alice C.");
await expectError("alice cannot change her own status", () => asUser(ids.alice, (tx) => tx.query("update public.profiles set status = 'active' where id = $1", [ids.alice])), /permission denied/);
expectEq("alice's update of dave's row affects 0 rows",
  (await asUser(ids.alice, (tx) => tx.query("update public.profiles set full_name = 'hacked' where id = $1", [ids.dave]))).affectedRows ?? 0, 0);
await expectError("alice cannot insert profiles", () => asUser(ids.alice, (tx) => tx.query("insert into public.profiles (id) values (gen_random_uuid())")), /permission denied/);
await expectError("alice cannot delete her profile via the API", () => asUser(ids.alice, (tx) => tx.query("delete from public.profiles where id = $1", [ids.alice])), /permission denied/);

console.log("Roles");
expectEq("alice sees only her roles", await asUser(ids.alice, (tx) => count(tx, "select * from public.user_roles")), 1);
await expectError("alice cannot grant herself admin", () => asUser(ids.alice, (tx) => tx.query("insert into public.user_roles (user_id, role) values ($1, 'super_admin')", [ids.alice])), /permission denied/);
await expectError("alice cannot rewrite her role", () => asUser(ids.alice, (tx) => tx.query("update public.user_roles set role = 'admin' where user_id = $1", [ids.alice])), /permission denied/);

console.log("Dietitian profiles & organizations");
expectEq("bob sees his own dietitian profile only", await asUser(ids.bob, (tx) => count(tx, "select * from public.dietitian_profiles")), 1);
expectEq("alice sees no dietitian profiles", await asUser(ids.alice, (tx) => count(tx, "select * from public.dietitian_profiles")), 0);
await expectError("carol cannot approve herself", () => asUser(ids.carol, (tx) => tx.query("update public.dietitian_profiles set verification_status = 'approved', verified_at = now() where user_id = $1", [ids.carol])), /permission denied/);
expectEq("bob sees only his organization", await asUser(ids.bob, (tx) => count(tx, "select * from public.organizations")), 1);
expectEq("alice sees no organizations", await asUser(ids.alice, (tx) => count(tx, "select * from public.organizations")), 0);
expectEq("carol sees only her org's members", await asUser(ids.carol, (tx) => count(tx, "select * from public.organization_members")), 1);

console.log("Relationships & consents");
expectEq("alice sees her relationship", await asUser(ids.alice, (tx) => count(tx, "select * from public.client_relationships")), 1);
expectEq("bob sees his relationship", await asUser(ids.bob, (tx) => count(tx, "select * from public.client_relationships")), 1);
expectEq("dave cannot see alice-bob relationship", await asUser(ids.dave, (tx) => count(tx, "select * from public.client_relationships where id = $1", [relAliceBob])), 0);
expectEq("alice sees her consent", await asUser(ids.alice, (tx) => count(tx, "select * from public.consents")), 1);
expectEq("bob sees the consent he received", await asUser(ids.bob, (tx) => count(tx, "select * from public.consents")), 1);
expectEq("dave cannot see alice's consent", await asUser(ids.dave, (tx) => count(tx, "select * from public.consents where client_user_id = $1", [ids.alice])), 0);
await expectError("alice cannot grant consent directly via the API", () => asUser(ids.alice, (tx) => tx.query("insert into public.consents (relationship_id, client_user_id, scope, consent_text_version) values ($1, $2, 'diary.read', 'v1')", [relAliceBob, ids.alice])), /permission denied/);

console.log("Access is withdrawn when conditions stop being true");
await db.query("update public.consents set revoked_at = now() where relationship_id = $1", [relAliceBob]);
expectEq("after revoking consent, bob no longer sees alice", await asUser(ids.bob, (tx) => count(tx, "select id from public.profiles where id = $1", [ids.alice])), 0);
await db.query("insert into public.consents (relationship_id, client_user_id, scope, consent_text_version) values ($1, $2, 'profile.read', 'v2')", [relAliceBob, ids.alice]);
expectEq("re-granted consent restores access", await asUser(ids.bob, (tx) => count(tx, "select id from public.profiles where id = $1", [ids.alice])), 1);
await db.query("update public.profiles set status = 'suspended' where id = $1", [ids.bob]);
expectEq("suspended dietitian loses client access", await asUser(ids.bob, (tx) => count(tx, "select id from public.profiles where id = $1", [ids.alice])), 0);
await db.query("update public.profiles set status = 'active' where id = $1", [ids.bob]);
await db.query("update public.client_relationships set status = 'ended', ended_at = now() where id = $1", [relAliceBob]);
expectEq("ended relationship removes access", await asUser(ids.bob, (tx) => count(tx, "select id from public.profiles where id = $1", [ids.alice])), 0);
await db.query("update public.profiles set status = 'suspended' where id = $1", [ids.dave]);
expectEq("suspended user cannot edit own profile (0 rows)",
  (await asUser(ids.dave, (tx) => tx.query("update public.profiles set full_name = 'x' where id = $1", [ids.dave]))).affectedRows ?? 0, 0);

console.log("Audit log");
await db.query("insert into public.audit_logs (actor_user_id, action, target_type, target_id) values ($1, 'role.granted', 'user', $2)", [ids.bob, ids.carol]);
ok("server can append audit entries");
await expectError("audit entries cannot be updated (even by the server)", () => db.query("update public.audit_logs set action = 'x'"), /append-only/);
await expectError("audit entries cannot be deleted (even by the server)", () => db.query("delete from public.audit_logs"), /append-only/);
await expectError("audit log cannot be truncated", () => db.query("truncate public.audit_logs"), /append-only/);
await expectError("signed-in users cannot read audit logs", () => asUser(ids.bob, (tx) => tx.query("select * from public.audit_logs")), /permission denied/);

console.log("Private helper functions");
await expectError("anon cannot call private helpers", () => asAnon((tx) => tx.query("select private.has_role('admin')")), /permission denied/);
expectEq("has_role works for the signed-in user", (await asUser(ids.carol, (tx) => tx.query("select private.has_role('dietitian') as r"))).rows[0].r, true);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
