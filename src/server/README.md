# Server-only code

Code here must never be imported by Client Components. Modules start with `import "server-only"`, so an accidental client import fails the build.

| Module | Status |
| --- | --- |
| `env-schema.ts` | ✅ Zod rules for env vars (shared with drizzle.config.ts and scripts; no `server-only`) |
| `env.ts` | ✅ `getServerEnv()`: validated, lazily, never prints values |
| `db/schema/` | ✅ Drizzle schema v1: profiles, user_roles, dietitian_profiles, organizations, organization_members, client_relationships, consents, audit_logs |
| `db/index.ts` | ✅ `getDb()`: privileged Drizzle client (bypasses RLS, so authorize in code) |
| `auth/` | ✅ `session.ts` (getAuthUser, getAccessContext), `guards.ts` (getAreaAccess, requireAreaAccess), `recovery.ts` (password-reset marker). 🟡 `requireClientAccess` (Step 7) |
| `payments/`, `ai/`, `email/` | 🟡 Later steps |
