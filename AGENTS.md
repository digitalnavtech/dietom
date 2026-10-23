<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Dietom: rules for AI coding agents

## Working agreement

- The owner is learning while building. Work **one roadmap step at a time** ([docs/ROADMAP.md](docs/ROADMAP.md)), explain important decisions, and **stop for approval** before starting the next step.
- Inspect existing code before changing it. Preserve working code; avoid destructive changes.
- Never add fake authentication, fake checkout, or UI that pretends an unbuilt feature works. Mark unbuilt features with `PlannedBadge` or clear "planned" copy.
- Keep docs in `docs/` in sync with what is actually implemented.

## Stack facts

- Next.js 16.4.2, React 19, App Router under `src/app/`, TypeScript strict, Tailwind CSS v4 (via `@tailwindcss/turbopack`, no PostCSS config).
- `cacheComponents` and `partialPrefetching` are enabled. Data is dynamic by default. Opt in to caching with `"use cache"` + `cacheLife`. Current time, random values and request data during prerender must be handled explicitly (see `src/components/layout/copyright-year.tsx`).
- shadcn/ui uses the `base-nova` style built on **Base UI** (`@base-ui/react`), not Radix. There is no `asChild`. To style a link as a button, use `buttonVariants()` on `<a>`/`<Link>`, or Base UI's `render` prop.
- `cn()` comes from the `cn` package (by shadcn), re-exported from `@/lib/utils`.
- Icons: `lucide-react` v1. Verify icon names exist before use.
- Base UI Select: pass `items={[{ value, label }]}` to `<Select>` so `<SelectValue>` shows the label. "No selection" is `null`, not `""`.
- `@hookform/resolvers` is pinned to 5.x. 6.0.0 has an unresolved peer-dependency conflict (Oct 2026); re-check before upgrading.
- `shadcn` is a **devDependency**: the app only imports its CSS at build time.
- Error boundaries (`error.tsx`) receive `{ error, retry }` in Next.js 16 (not `reset`).
- Reading `searchParams`, `cookies()` or `headers()` makes that component dynamic. With Cache Components it must sit inside `<Suspense>` (see `app/(marketing)/ui-kit/page.tsx`).
- Components (e.g. Lucide icons) can't be passed as props from Server to Client Components. Pass a key and look up config on the client (see `DashboardNavLinks`).

## Where things go

| What | Where |
| --- | --- |
| shadcn primitives (generated) | `src/components/ui/`. Add with `npx shadcn add <name>`, don't hand-write |
| Form controls wired to React Hook Form | `src/components/forms/` (`FormField` + typed wrappers) |
| Generic reusable UI (tables, states, search, dialogs) | `src/components/shared/` |
| Dashboard chrome | `src/components/dashboard/` |
| Dashboard routes + titles + nav | `src/config/dashboard-nav.ts` (single source) |
| Zod schemas, feature UI, sample data | `src/features/<feature>/` |
| Pure, framework-free helpers + tests | `src/lib/` (`*.test.ts` next to the code) |

## Code conventions

- Prefer Server Components. Add `"use client"` only for state, effects, or browser APIs, and keep client components small (see `mobile-nav.tsx`).
- `src/app/` holds routes and layouts only. Feature logic and UI live in `src/features/<feature>/`; shared UI lives in `src/components/`.
- Brand text and navigation come from `src/config/site.ts`. Prices and plan limits must come from configuration or the database, never hardcoded in business logic.
- Import with the `@/` alias. Use named exports for components, and default exports only where Next.js requires them (pages, layouts).
- Accessibility: semantic landmarks, one `h1` per page, labelled sections, visible focus states, `aria-hidden` on decorative icons.
- Forms: Zod schema in the feature's `schemas.ts`, `useForm<z.input, unknown, z.output>` with `zodResolver`, fields via `src/components/forms/*`. Reuse the same schema in server actions later.
- Toasts: call `toast()` from `sonner` in client components. Never add a second `<Toaster />`. Don't toast success for things that didn't happen.
- Lists: parse URL params with `parseListQuery`, then filter → sort → paginate. Keep list state in the URL.
- Sample/demo data lives only in `src/features/ui-kit/` and must be labelled fictional on screen.

## Step 2 preview rules (until auth exists)

- Dashboards are **public interface previews**. Every page shows `PreviewNotice`. No fake names, payments, health metrics or "secure" labels.
- Preview routes are `noindex` and disallowed in `robots.ts`. Keep `previewOnlyPaths` in `src/config/site.ts` up to date.

## Security non-negotiables (from Step 2 onward)

- Authorize on the server for every protected page, server action, route handler and query. Never trust client-side role checks.
- Public sign-up can never grant `admin` or `super_admin`.
- Dietitians access client data only through an active, consented assignment, and only after verification.
- Validate all input with Zod. Verify webhook signatures. Make payment handling idempotent.
- Secrets live in environment variables only. Never prefix secrets with `NEXT_PUBLIC_`.
- Label AI nutrition output as educational, not medical advice.

## Before finishing any change

Run `npm run lint`, `npm test`, `npx tsc --noEmit` and `npm run build`. All must pass. Don't claim browser testing unless it was actually performed.
