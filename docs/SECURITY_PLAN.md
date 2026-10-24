# Security Plan

> 🟡 **Planned controls.** Step 1 has no auth, database, payments or AI, so there is no sensitive data yet. This plan is applied from Step 2 onward.

## 1. Threat model (summary)

| Asset | Main risks |
| --- | --- |
| Health data (profiles, diaries, questionnaires) | Cross-user/tenant leaks, over-broad dietitian access, admin misuse, leaking via logs or AI prompts |
| Accounts and roles | Privilege escalation (self-assigning admin), session theft, credential stuffing |
| Payments and entitlements | Forged webhooks, replayed events, double-granting, client-side price tampering |
| AI credits | Abuse, prompt injection, runaway cost |
| eBooks | Unauthorised downloads, link sharing |
| Dietitian documents | Exposure of identity/credential files |

## 2. Authentication and sessions
- Supabase Auth, sessions in **HTTP-only, Secure, SameSite=Lax** cookies. No tokens in `localStorage`.
- Session refresh in `proxy.ts`. Server code always revalidates the user (`getUser()`, which contacts the auth server) instead of trusting unverified cookie contents. ✅ Implemented in Phase 4A (`src/proxy.ts`, `src/server/auth/session.ts`); verified that forged and garbage sessions are rejected.
- Rate-limit sign-in, sign-up, OTP and password reset. Optional MFA for dietitians, mandatory MFA for admins.

## 3. Authorization
- **Server-side checks everywhere:** layouts, pages, server actions, route handlers, and queries. Hidden buttons are UX, not security.
- Central guards: `requireUser`, `requireRole`, `requireVerifiedDietitian`, `requireClientAccess(clientId, scope)`.
- Roles live in `user_roles`. Public sign-up can only create `customer` or a **pending** dietitian application. `admin`/`super_admin` are granted only by a super admin and audited.
- Dietitian data access = verified dietitian + active relationship + unrevoked consent scope.
- Organization isolation via `organization_id` filters + RLS (defence in depth).
- Server actions are public HTTP endpoints. Each one authenticates, authorizes and validates its own input.

## 4. Input validation and output safety
- Zod schemas for every form, action, route handler, webhook payload and env var.
- Drizzle parameterised queries only. No string-built SQL.
- React escapes output by default. Never use `dangerouslySetInnerHTML` with user or AI content without sanitising.
- Security headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (at Traefik).

## 5. Payments
- Prices are read from the database on the server. The client sends only a plan/price id, never an amount.
- Razorpay webhook: verify the HMAC signature on the **raw body** with the webhook secret before parsing.
- **Idempotency:** insert `provider_event_id` into `webhook_events` (unique). Duplicates are acknowledged and skipped.
- Entitlements are granted only from verified webhooks or server-side payment verification, never from the browser redirect alone.
- Refunds and cancellations follow implemented rules. Marketing copy must match them.

## 6. AI safety and cost control
- OpenAI key is server-only. Every AI call checks quota/credits **before** calling and records an `ai_usage_events` row after.
- Per-user and per-IP rate limits; maximum input sizes; model allow-list.
- RAG retrieval filtered by visibility/organization so one tenant's documents never reach another's prompts.
- Treat retrieved text and user input as untrusted (prompt-injection aware system prompts; no tool access to private data beyond the requesting user's scope).
- All AI nutrition output carries a visible disclaimer: **educational, not a substitute for professional medical care**. Flag allergies and medical conditions for review rather than giving clinical advice.

## 7. Files and eBooks
- eBooks and verification documents live in **private** storage buckets.
- Access is granted through short-lived signed URLs issued after an entitlement/role check.
- Optional watermarking with the buyer's email. Download events are logged.

## 8. Secrets and configuration
- Secrets only in environment variables (`.env.local` locally, git-ignored; GitHub Actions secrets and VPS env in production).
- Never prefix secrets with `NEXT_PUBLIC_`. Validate env vars with Zod at startup.
- Separate keys per environment. Rotate on suspicion of exposure.

## 9. Privacy and consent
- Explicit, versioned consent for sharing data with a dietitian, revocable at any time.
- Clear privacy policy and terms before launch. Data export and deletion flows (DPDP Act 2023; GDPR when serving the EU).
- No sensitive data in analytics or error logs. Scrub logs.

## 10. Audit logging
Append-only `audit_logs` for: role changes, dietitian verification decisions, consent grants/revocations, admin access to personal data, refunds, plan/price changes and entitlement changes.

## 11. Reliability and error handling
- `error.tsx` / `not-found.tsx` boundaries. User-friendly messages without stack traces.
- Background jobs with retries and dead-letter handling for email and webhook processing.
- Structured logging without PII. Uptime and error monitoring.

## 12. Accessibility and SEO (quality baseline)
- WCAG 2.2 AA target: semantic HTML, labelled landmarks, keyboard navigation, visible focus, colour contrast, reduced-motion support.
- Public pages: metadata, Open Graph, `sitemap.ts`, `robots.ts`, structured data where useful. Private pages: `noindex`.

## 13. Current status (after Step 4A)
✅ No secrets, no data collection, no third-party scripts. ✅ Skip link, semantic landmarks, focus styles, reduced-motion respected. ✅ The demo form keeps input in the browser tab only and asks users not to enter health details.

⚠ Correction to the Step 1 note: `shadcn init` had added the `shadcn` CLI to production `dependencies`, which made `npm audit --omit=dev` report a high-severity `braces` advisory (via `fast-glob`). The app only imports `shadcn/tailwind.css` at build time, so `shadcn` was moved to `devDependencies` in Step 2. The production audit now reports 0 vulnerabilities. The remaining advisories are in dev-only tooling and never shipped.

⚠ Dashboard routes are **public previews** with no access control. They must contain no real or realistic personal data until Step 4 adds server-side guards.

✅ Step 3: RLS on all 8 tables, 9 read-side policies, append-only audit log; Supabase Security Advisor: 0 issues.

✅ Step 4A: session handling as described in §2. Public env validation refuses secret/service-role keys in `NEXT_PUBLIC_*`. The service-role key is not used anywhere. Browser bundles scanned: no `DATABASE_URL`, secret keys or server-only modules.

✅ Step 4B: sign-in/up/out, email confirmation, password reset; every dashboard page authorizes on the server; safe redirects; no account enumeration; reset requires a verified recovery link and signs out all sessions.

⚠ Still open: rate limiting relies on Supabase's built-in limits (no app-level limiter or CAPTCHA yet); no MFA; end-to-end flows not yet tested with real accounts; Supabase's built-in email sender is rate-limited (custom SMTP needed before launch).
