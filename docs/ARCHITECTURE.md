# Architecture

> ✅ implemented · 🟡 planned · 👁 UI-only preview (looks real, no data or auth behind it)

## 1. Overview

A single Next.js 16 application (App Router) that serves the public site, three role-based dashboards and server-side APIs. It talks to Supabase (Auth + Postgres) through Drizzle, to Razorpay for payments, to OpenAI for AI features and to Resend for email. It deploys as a Docker container behind Traefik on a Hostinger VPS.

```
Browser ──► Traefik (TLS) ──► Next.js container
                                 ├─ Server Components / Server Actions / Route Handlers
                                 ├─► Supabase Postgres (Drizzle, RLS)      🟡
                                 ├─► Supabase Auth (sessions via cookies)  🟡
                                 ├─► Razorpay API + webhooks               🟡
                                 ├─► OpenAI API (chat, embeddings, image)  🟡
                                 └─► Job queue ─► Resend (email)           🟡
```

## 2. Folder structure

```
src/
  app/                         Routes, layouts and route handlers ONLY
    layout.tsx                 ✅ Root: fonts, metadata, ThemeProvider, the single <Toaster />
    not-found.tsx              ✅
    robots.ts, sitemap.ts      ✅ SEO routes
    opengraph-image.tsx        ✅ Generated social image (twitter-image.tsx re-exports it)
    (marketing)/               ✅ Header + footer layout
      page.tsx                 ✅ "/"
      ui-kit/page.tsx          ✅ "/ui-kit" component showcase (noindex)
      pricing/ ebooks/ recipes/                  🟡
    (auth)/sign-in, sign-up                      🟡
    (customer)/                👁 layout.tsx → DashboardShell area="customer", error.tsx
      dashboard/...            👁 7 pages
    (dietitian)/dietitian/...  👁 6 pages
    (admin)/admin/...          👁 6 pages
    api/webhooks/razorpay/route.ts               🟡
  components/
    ui/          ✅ shadcn/ui primitives (generated; Base UI under the hood)
    forms/       ✅ FormField + TextInputField, SelectField, TextareaField, FormErrorMessage
    shared/      ✅ DataTable, SearchInput, FilterControls, PaginationControls, ConfirmDialog,
                    LoadingSpinner, LoadingSkeleton, EmptyState, ErrorState, PreviewNotice,
                    PlannedBadge, SectionHeading
    dashboard/   ✅ DashboardShell, DashboardSidebar, MobileDashboardNavigation,
                    DashboardNavLinks, DashboardHeader, DashboardError
    layout/      ✅ Site header, footer, logo, mobile nav, copyright year
    theme/       ✅ ThemeProvider, ThemeToggle
  config/
    site.ts           ✅ Brand, public URL (NEXT_PUBLIC_SITE_URL), nav, preview-only paths
    dashboard-nav.ts  ✅ Every dashboard route: title, icon, description, planned content
  features/
    marketing/   ✅ Homepage sections and copy
    dashboards/  ✅ Preview page templates + metadata helpers
    ui-kit/      ✅ Demo-only: form schema, demo components, FICTIONAL sample eBooks
    auth/ billing/ tracker/ meal-plans/ recipes/ ebooks/ quizzes/ ai/ admin/ notifications/   🟡
  lib/           ✅ utils.ts (cn), list-query.ts (+ list-query.test.ts)
  server/        ✅ env.ts, env-schema.ts, db/ (Drizzle client + schema v1)
                 🟡 auth guards, payments, ai, email
drizzle/         ✅ SQL migrations: 0000 generated, 0001 hand-written security layer (applied)
scripts/db/      ✅ test-migrations.mjs (PGlite + RLS tests), preflight.ts + verify.ts (read-only checks)
```

### Data access model (Step 3)

```
Browser ──(publishable key + user JWT)──► Supabase Data API ──► RLS policies apply
                                            anon: no table access
                                            authenticated: read own / org / consented rows,
                                                           edit 5 own-profile columns

Next.js server ──(DATABASE_URL, role "postgres")──► Postgres   ⚠ bypasses RLS
                    getDb() in src/server/db           → every caller authorizes in code
                                                         (Step 4 guards), then writes
```

RLS is the safety net for anything reachable from the browser. The server is the only writer. In Step 4, guards (`requireUser`, `requireRole`, `requireClientAccess`) run before any `getDb()` call. If a future feature needs per-user RLS on server queries, a `withUserContext()` helper can run a transaction as `authenticated` with the user's JWT claims.

### Why feature-based?

Code that changes together lives together. A feature folder holds its own `components/`, `schemas.ts` (Zod), `content.ts`, and later `actions.ts` (server actions) and `queries.ts`. `src/app/` stays thin: a page imports from a feature and composes it.

### Route groups

Folders in parentheses organize routes and give each section its own layout **without changing URLs**. `src/app/(customer)/dashboard/diet-tracker/page.tsx` serves `/dashboard/diet-tracker`. Each dashboard group has its own `layout.tsx` (which shell and nav to use), `error.tsx` (error boundary inside the shell) and `noindex` metadata. In Step 4 the layout is also where the server-side auth guard goes.

## 3. Rendering model

- **Server Components by default.** They render on the server and ship no JavaScript for static parts.
- **Client Components (`"use client"`) only when needed** (state, effects, browser APIs, event handlers) and kept small. On dashboards only the nav links (they need `usePathname` for highlighting), the drawer and the theme menu are client components. The shell, header, page content and tables are server components.
- **Server → client props must be serializable.** Functions and components (e.g. Lucide icons) can't cross that boundary. That's why `DashboardNavLinks` receives `area="customer"` and looks the config up itself.
- **Cache Components** (`cacheComponents: true`): data is per-request unless explicitly cached with `"use cache"`. That's the right default for personal health data.
- **Partial Prerendering:** `/ui-kit` is the example. The page shell is static HTML. Only `EbookCatalogDemo` reads `searchParams`, so it's wrapped in `<Suspense>` and streamed (`◐` in the build output). All dashboard previews are fully static (`○`).

## 4. Shared component architecture

Three layers, each depending only on the layers below:

| Layer | Folder | Rule |
| --- | --- | --- |
| Primitives | `components/ui/` | shadcn-generated. Styling + accessibility of single controls. Edit sparingly. |
| Generic building blocks | `components/forms`, `components/shared`, `components/dashboard` | No business words (no "eBook", "client"). Typed props, callbacks instead of hard-wired behaviour. |
| Feature components | `features/<name>/components` | Wire generic blocks to a use case (URL state, schemas, copy). |

Example: `SearchInput` (generic) only reports text after a debounce. `CatalogToolbar` (feature) decides that a search means updating `?q=` in the URL.

**States:** `LoadingSpinner` (inline busy indicator, `role="status"`), `LoadingSkeleton` (Suspense fallbacks: lines/cards/table), `EmptyState` (nothing to show + optional action), `ErrorState` (friendly message, never raw errors), `PreviewNotice` (preview banner, `role="note"`).

**DataTable** is presentation-only and a Server Component: columns are `{ id, header, cell(row) }`, and `responsiveClassName` hides low-priority columns on phones. Sorting/paging happen before rows reach it.

**ConfirmDialog** wraps Base UI's AlertDialog: focus is trapped, Escape cancels, and an async `onConfirm` shows a busy state and keeps the dialog open until it finishes.

## 5. Dashboard layout design

One `DashboardShell` serves all three dashboards. `src/config/dashboard-nav.ts` is the single source for every route's title, icon, description and planned content. Sidebar, drawer, page `<title>`, overview cards and the homepage's route list all read it.

| Screen | Navigation |
| --- | --- |
| Phone (< 768px) | Top bar with a menu button → left drawer (`Sheet`): focus trap, Escape to close, closes after navigating |
| Tablet (768–1023px) | Sticky **icon rail** (64px). Labels kept for screen readers (`sr-only`) and as tooltips |
| Desktop (≥ 1024px) | Sticky full sidebar (256px) with labels |

Active route: `isNavItemActive()`. The area home ("Overview") matches exactly; other items also match nested paths (`/dietitian/clients/123` → Clients). The active link gets `aria-current="page"` plus a highlight.

Every page renders `DashboardHeader` (owns the page `h1`) and either `DashboardOverview` (section cards) or `DashboardPagePreview` (empty state + "planned for this page"). No invented names, payments or metrics are shown.

## 6. Form validation approach

```
Zod schema (features/<f>/schemas.ts)
   │  z.input  = values while editing          z.output = cleaned values (trimmed)
   ▼
useForm<z.input, unknown, z.output>({ resolver: zodResolver(schema), mode: "onTouched" })
   │
   ▼
<TextInputField control name label … />  →  FormField  →  Controller + Field + FormErrorMessage
```

- **Generic, type-safe fields:** `name` is checked against the schema at compile time.
- **Accessibility built into `FormField`:** `<label for>`, `aria-invalid`, `aria-describedby` pointing at the description and error, and errors in `role="alert"` so they're announced. `noValidate` on the form replaces browser bubbles with these messages.
- **Timing:** `onTouched` validates when a field loses focus, then live while correcting. On submit, invalid fields get focus and an error toast.
- **Submission states:** `isSubmitting` disables the whole `<fieldset>` and shows a spinner. A form-level `FormErrorMessage` shows failures.
- **Security note:** browser validation is for user experience only. From Step 4, server actions re-validate with the **same schema**, because anyone can bypass the browser.
- **Demo:** `/ui-kit` newsletter-interest form, UI-only. It stores and sends nothing and says so in the success toast.

## 7. Notification architecture

- **Now:** Sonner. One `<Toaster richColors closeButton />` in the root layout, themed via next-themes. Any client component calls `toast.success/error/info/warning/promise()`.
- **Rules:** toast only for things that actually happened. Errors say what to do next. Validation details stay next to fields (toast is a summary).
- **Planned (Step 10):** domain events → (a) toast for immediate feedback in the browser, (b) a stored `notifications` row for the in-app inbox, (c) an email job (Resend; Mailpit locally) processed by a background worker with retries.

| Planned event | Toast | In-app | Email |
| --- | --- | --- | --- |
| Account created / email verification | ✓ | | ✓ |
| Sign-in (new device) | ✓ | | optional |
| eBook purchase | ✓ | ✓ | ✓ receipt |
| Payment failed | ✓ | ✓ | ✓ |
| Subscription changed | ✓ | ✓ | ✓ |

Server actions can't call `toast()` (it's browser-only). They will return a typed result (`{ ok: true } | { ok: false, error }`) and the client shows the toast.

## 8. Search, filter and pagination design

**List state lives in the URL:** `?q=&category=&sort=&page=`. That makes it shareable, bookmarkable, refresh-safe and Back-button friendly, and lets the server render the results.

```
URL ─► parseListQuery()        validates untrusted input → ListQuery { q, category, sort, page }
         │                     (unknown category/sort ignored, page ≥ 1, q ≤ 100 chars)
         ▼
     filterBySearch → filterByCategory → sortByTitleOrDate → paginate   (src/lib/list-query.ts)
         ▼
     DataTable / EmptyState + PaginationControls (real <Link>s built by buildListHref)
```

- Client side: `CatalogToolbar` receives the parsed `ListQuery` from the server (no `useSearchParams`), and on change calls `router.replace(buildListHref(...))` inside `startTransition`, so old results stay visible while new ones load. Filter changes reset to page 1. "Reset filters" returns to the bare path.
- `paginate()` clamps out-of-range pages (`?page=99` → last page).
- Tests: `npm test` runs 19 unit tests (Node's built-in runner).

**Connecting to Supabase + Drizzle later:** the in-memory functions are replaced by one query that consumes the same `ListQuery`. The pagination UI doesn't change.

```ts
// Sketch only. Not implemented.
const where = and(
  eq(ebooks.status, "published"),
  query.q ? ilike(ebooks.title, `%${escapeLike(query.q)}%`) : undefined, // later: full-text / pg_trgm
  query.category ? eq(ebooks.category, query.category) : undefined,
);
const orderBy = {
  newest: [desc(ebooks.publishedOn), asc(ebooks.title)],
  oldest: [asc(ebooks.publishedOn), asc(ebooks.title)],
  "title-asc": [asc(ebooks.title)],
  "title-desc": [desc(ebooks.title)],
}[query.sort];
const [rows, [{ total }]] = await Promise.all([
  db.select().from(ebooks).where(where).orderBy(...orderBy)
    .limit(PAGE_SIZE).offset((query.page - 1) * PAGE_SIZE),
  db.select({ total: count() }).from(ebooks).where(where),
]);
```

- Use indexes matching filter + sort (e.g. `(status, category, published_on)`) and a trigram/full-text index for search.
- Offset pagination is fine for admin tables. For very large or fast-changing lists (food diary history), switch to **keyset (cursor) pagination** (`WHERE (published_on, id) < (:last_date, :last_id)`).
- Public catalogue queries can be cached (`"use cache"` + `cacheTag("ebooks")`). Per-user lists must stay uncached.

## 9. Theme

- `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`. It writes the `dark` class before first paint (no flash), using the OKLCH tokens in `globals.css`.
- `<html suppressHydrationWarning>` (only that element's attributes) because the class is set before React hydrates.
- `ThemeToggle` never reads the theme during render. Both icons are rendered and CSS (`dark:`) shows one, so server and client HTML match.
- Reduced motion: no theme transition, and smooth scrolling is disabled under `prefers-reduced-motion`.

## 10. SEO and metadata

- `metadataBase` = `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`; invalid values fail the build). No production domain is hard-coded.
- **Canonical strategy:** each indexable public page declares `alternates.canonical` with its own path (homepage: `"/"`). The root layout deliberately sets none, because children would inherit it. Query-string variants (e.g. future `/ebooks?page=2`) will canonicalize to the clean path unless they represent distinct content.
- Open Graph + X card metadata in the root layout. `opengraph-image.tsx` generates a 1200×630 PNG at build time, and `twitter-image.tsx` reuses it.
- Preview routes (`/dashboard`, `/dietitian`, `/admin`, `/ui-kit`): `noindex, nofollow` meta + `robots.txt` disallow + excluded from `sitemap.xml`. Not linked from the public nav.
- Pending: a designed social image with brand font/illustration (current one is generated text).

## 11. Role-based access plan (Step 4)

Nothing below is implemented. Today every dashboard is a public preview.

1. **Session:** Supabase Auth cookies. `src/proxy.ts` (Next.js 16's name for middleware) refreshes the session and redirects signed-out visitors away from `/dashboard`, `/dietitian`, `/admin`. That's a convenience, **not** the security boundary.
2. **Layout guards (real boundary for pages):**
   - `(customer)/layout.tsx` → `await requireRole("customer")`
   - `(dietitian)/layout.tsx` → `await requireRole("dietitian")`. Pages with client data also call `requireVerifiedDietitian()`
   - `(admin)/layout.tsx` → `await requireRole(["admin", "super_admin"])`
3. **Every server action / route handler / query re-checks**, because layouts don't protect actions, and data access must check ownership (`requireClientAccess(clientId, scope)`).
4. With Cache Components, guards read cookies, so the guarded part renders inside `<Suspense>`. The static shell (sidebar) stays prerendered without user data.
5. Navigation can hide links a user can't use, but hiding is UX. The server decides.
6. Roles come from `user_roles`. Multi-role users get an area switcher in the shell.

## 12. UI-only previews (honesty list)

| Feature | Status |
| --- | --- |
| Dashboard pages (19) | 👁 Layout and navigation only. No data, no auth |
| Newsletter-interest form (`/ui-kit`) | 👁 Validates in the browser. Never saved or sent |
| Toast examples (`/ui-kit`) | 👁 Labelled "Demo" |
| eBook catalogue (`/ui-kit`) | 👁 14 fictional sample entries, no prices, not for sale |
| Theme toggle, search/filter/pagination mechanics | ✅ Fully working |

## 13. Integrations (planned)

| Concern | Approach |
| --- | --- |
| Payments | `PaymentProvider` interface (`createCheckout`, `verifyWebhook`, `cancelSubscription`, `refund`). `RazorpayProvider` first |
| Webhooks | Route handler, signature verification on raw body, idempotency table, async processing |
| Entitlements | Single `hasEntitlement(user, feature)` derived from subscriptions, purchases and credits |
| AI | Server-only OpenAI client. Quota check before, usage event (tokens, cost, credits) after each call |
| RAG | Curated documents → chunks → embeddings (pgvector). Retrieval filtered by visibility/tenant |
| Email | Domain events enqueue jobs. A worker sends via Resend and logs delivery. Mailpit locally |

## 14. Environments (planned)

`local` (Docker Compose: app + Mailpit, Supabase local or cloud dev project), `staging`, `production`. Environment variables validated with Zod at startup (from Step 3).
