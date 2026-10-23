# Dietom

India-first, AI-assisted nutrition SaaS for **individual customers** and **professional dietitians**, with a separate platform admin area. Designed to support international customers later.

> **Status: Step 3 (database) complete.** Schema v1 + security migrations are applied to Supabase and verified. No sign-in yet (Step 4). Step 2 (UI foundation) is complete: the homepage, a shared component kit and **interface previews** of all three dashboards exist. Accounts, real data, payments, AI and email are **planned, not implemented**. Dashboards are public previews with no authentication. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Tech stack

| Area | Installed | Planned |
| --- | --- | --- |
| Framework | Next.js 16.4.2 (App Router, `src/`, Turbopack, Cache Components), React 19.3 | — |
| Language | TypeScript 5 (strict) | — |
| Styling | Tailwind CSS v4, shadcn/ui (`base-nova` style on Base UI), Lucide icons, next-themes (light/dark/system) | — |
| Forms | React Hook Form 7, Zod 4, @hookform/resolvers 5 | — |
| Notifications | Sonner (toasts) | Resend, Mailpit (local), background jobs |
| Testing | Node's built-in test runner (`node --test`); PGlite (in-memory Postgres 17) for migration + RLS tests | Component/E2E tests later |
| Database | Drizzle ORM 0.45 + drizzle-kit, postgres.js driver, schema v1 migrations with RLS (applied + verified) | — |
| Auth | @supabase/ssr 0.12 + supabase-js 2.117: browser/server clients, session-refresh proxy, server identity helpers (**Phase 4A**, no sign-in UI yet) | Sign-in/up UI and route protection (Phase 4B) |
| Payments | — | Razorpay behind a provider abstraction |
| AI | — | OpenAI API, RAG, usage credits |
| Deployment | — | Docker, Traefik, Hostinger Ubuntu VPS, GitHub Actions |

## Getting started

Requirements: Node.js **22.18 or newer** (for type-stripped tests; the app itself needs 20.9+). Developed on Node 24.

```bash
npm install
cp .env.example .env.local   # optional; defaults work locally
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Unit tests for list utilities (`src/**/*.test.ts`) |
| `npm run db:test` | Applies all migrations to an in-memory Postgres and checks constraints, triggers and RLS (57 checks). No network |
| `npm run db:generate` | Generate a migration from schema changes (offline). `-- --custom --name=x` for hand-written SQL |
| `npm run db:preflight` | **Read-only** connection + conflict check against `DATABASE_URL` |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL`. Run only after review and approval |
| `npm run db:check` | Check migration files are consistent |
| `npm run db:verify` | **Read-only** PASS/FAIL check of RLS, policies, migrations, triggers, grants and enums on `DATABASE_URL` |
| `npx tsc --noEmit` | Type-check without emitting files |

### Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No (defaults to `http://localhost:3000`) | Public base URL for canonical links, sitemap, robots and Open Graph. Set it per environment; no production domain is assumed. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (from Step 3) | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes (from Step 3) | Publishable (browser-safe) key. Safe only because RLS protects every table |
| `DATABASE_URL` | Yes for DB work | Postgres connection string (Supabase **Session pooler**). Server-only secret. Logs in as `postgres`, which **bypasses RLS** |

## What you can try

| URL | What it shows |
| --- | --- |
| `/` | Public homepage (light/dark toggle in the header) |
| `/ui-kit` | Component showcase: validated form, toasts, URL-driven search/filter/sort/pagination over **fictional** sample eBooks, loading/empty/error states |
| `/dashboard/*` | Customer dashboard preview (7 pages) |
| `/dietitian/*` | Dietitian dashboard preview (6 pages) |
| `/admin/*` | Admin dashboard preview (6 pages) |

All dashboard pages show *"Interface preview — authentication and live data are not connected yet."* They're excluded from search engines (`noindex` + `robots.txt`).

## Project structure

```
src/
  app/
    layout.tsx, globals.css       Root layout (theme, toaster, metadata), theme tokens
    robots.ts, sitemap.ts         SEO routes
    opengraph-image.tsx           Generated social image (+ twitter-image.tsx)
    (marketing)/                  Public pages with header + footer: "/", "/ui-kit"
    (customer)/dashboard/...      Customer preview, shared DashboardShell
    (dietitian)/dietitian/...     Dietitian preview
    (admin)/admin/...             Admin preview
  components/
    ui/                           shadcn/ui primitives (generated)
    forms/                        FormField, TextInputField, SelectField, TextareaField, FormErrorMessage
    shared/                       DataTable, SearchInput, FilterControls, PaginationControls, ConfirmDialog, states...
    dashboard/                    DashboardShell, DashboardSidebar, MobileDashboardNavigation, DashboardHeader
    layout/                       Site header, footer, logo, mobile nav
    theme/                        ThemeProvider, ThemeToggle
  config/                         site.ts (brand, SEO URL), dashboard-nav.ts (all dashboard routes)
  features/                       marketing, dashboards, ui-kit (demo-only code + sample data)
  lib/                            utils.ts, list-query.ts (+ tests)
  proxy.ts                        Next.js 16 Proxy: refreshes the Supabase session (no redirects yet)
  lib/supabase/                   Browser client, public env check, session refresh, cookie helpers
  server/                         Server-only: env.ts, db/ (Drizzle), supabase/ (server client), auth/ (identity helpers)
drizzle/                          SQL migrations (0000 generated, 0001 hand-written security layer)
scripts/db/                       test-migrations.mjs (PGlite tests), preflight.ts + verify.ts (read-only checks)
docs/                             Project, architecture, database, security docs and roadmap
```

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md): what we're building and for whom
- [Architecture](docs/ARCHITECTURE.md): folders, rendering, components, dashboards, forms, notifications, pagination, access plan
- [Roadmap](docs/ROADMAP.md): step-by-step build plan
- [Database plan](docs/DATABASE_PLAN.md): planned entities, ownership and tenancy
- [Security plan](docs/SECURITY_PLAN.md): data protection, payments and AI safety

## Medical disclaimer

Nutrition and AI-generated content on Dietom is educational and is not a substitute for advice from a qualified doctor or registered dietitian.
