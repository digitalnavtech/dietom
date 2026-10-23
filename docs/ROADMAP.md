# Roadmap

Each step ends with lint + type-check + build passing, docs updated, and **owner approval before the next step starts**.

| # | Step | Status |
| --- | --- | --- |
| 1 | Foundation: Next.js, Tailwind, shadcn, structure, homepage, docs | ✅ Done |
| 2 | Shared UI kit and app shells | ✅ Done |
| 3 | Supabase + Drizzle: schema v1, migrations, RLS | 🟡 Next (proposed) |
| 4 | Authentication and roles | 🟡 |
| 5 | Public catalogue pages (pricing, recipes, eBooks) | 🟡 |
| 6 | Customer dashboard: profile and diet tracker | 🟡 |
| 7 | Dietitian verification, consent and client management | 🟡 |
| 8 | Meal plans, templates and recipe library | 🟡 |
| 9 | Payments: Razorpay, subscriptions, entitlements | 🟡 |
| 10 | Email and notifications: Resend, Mailpit, job queue | 🟡 |
| 11 | AI: recipe generator, credits and usage tracking | 🟡 |
| 12 | RAG nutrition assistant | 🟡 |
| 13 | eBook store and secure reader | 🟡 |
| 14 | Quizzes | 🟡 |
| 15 | Admin dashboard | 🟡 |
| 16 | Deployment: Docker, Traefik, Hostinger VPS, GitHub Actions | 🟡 |
| 17 | Hardening: rate limiting, audit review, accessibility and SEO pass, tests | 🟡 (ongoing) |

## Step details

### Step 1: Foundation ✅
Next.js 16.4.2 + React 19 + TS strict + Tailwind v4 + shadcn/ui (Base UI). Feature-based folders, `(marketing)` route group, responsive homepage (header, hero, feature cards, dashboards overview, safety, footer), 404 page, and the docs in this folder.

### Step 2: Shared UI kit and app shells ✅
- Added React Hook Form 7, Zod 4, @hookform/resolvers 5 (6.0.0 skipped: peer conflict, 4 days old), Sonner, next-themes. Moved `shadcn` to devDependencies.
- Form kit (`FormField` + text/select/textarea fields + error message), shared states, `DataTable`, `SearchInput`, `FilterControls`, `PaginationControls`, `ConfirmDialog`.
- One responsive `DashboardShell` (drawer / icon rail / full sidebar) with active-route highlighting, used by `(customer)`, `(dietitian)`, `(admin)` groups. 19 preview pages, all `noindex`, each showing the preview notice.
- `/ui-kit` showcase: validated UI-only form, toast demo, URL-driven search/filter/sort/pagination over fictional sample eBooks, loading/empty/error states.
- Pure list utilities + 19 unit tests on Node's built-in runner.
- Light/dark/system theme. `robots.ts`, `sitemap.ts`, generated OG/X image, configurable `NEXT_PUBLIC_SITE_URL`, canonical strategy.

### Step 3: Database (proposed next)
Supabase project, Drizzle config, schema v1 from [DATABASE_PLAN.md](DATABASE_PLAN.md) (start with identity, roles, profiles, organizations, relationships/consent, audit log), migrations, RLS policies, seed script for roles. Env validation with Zod (`src/server/env.ts`). No auth UI yet.

### Step 4: Auth and roles
Supabase Auth (email + OTP/magic link, Google later), `proxy.ts` session refresh, server guards, sign-in/up pages, role-based redirects. Customer role by default; dietitian applicants get a pending state.

### Steps 5–15
Built feature by feature, each with its own schema additions, server actions, Zod schemas, UI and tests.

### Step 16: Deployment
Multi-stage Dockerfile (`output: "standalone"`), Docker Compose with Traefik and Let's Encrypt, GitHub Actions: lint → type-check → build → push image → deploy over SSH. Secrets in GitHub/VPS environment, never in the repo.

## Deferred / future
Appointments and video consults, WhatsApp/Meta integrations, international payment provider(s), multi-language UI, native mobile apps.
