# Project Overview

**Dietom** is an India-first, AI-assisted nutrition SaaS. It serves two audiences, individual customers and professional dietitians, plus a platform admin team. It is designed so international customers, currencies and payment providers can be added later without a rewrite.

> Status legend: ✅ implemented · 🟡 planned
> As of Step 1, only the public homepage (✅) exists. Everything else in this document is 🟡 planned.

## 1. Audiences

### A. Individual customers 🟡

| Capability | Notes |
| --- | --- |
| Personal dashboard | Daily summary, active plan, shortcuts |
| Diet & food tracking | Food diary with Indian foods; calories, macros, key micronutrients |
| AI recipe generator | From ingredients, goals and restrictions; uses AI credits |
| Weekly meal plans | Self-built or assigned by a consented dietitian |
| Nutrition quizzes | Knowledge building and personalisation signals |
| eBook store & library | One-time purchases, secure reading access |
| RAG nutrition assistant | Answers grounded in a curated knowledge base, with sources |
| Subscription management | Free / Pro, monthly or yearly, upgrade, downgrade, cancel |
| Notifications | Email (Resend) and in-app (Sonner toasts + stored notifications) |

### B. Professional dietitians 🟡

| Capability | Notes |
| --- | --- |
| Professional dashboard | Separate area at `/dietitian` |
| Professional verification | Credential review by admins before restricted tools unlock |
| Client management | Only clients with an active, consented relationship |
| Questionnaires | Intake and follow-up forms; responses stored per client |
| Meal plan templates | Reusable, then customised per client |
| Recipe library | Personal recipe collection reused across plans |
| Progress tracking | Review client diaries and trends |
| Appointments | Future phase |
| Subscription & AI credits | Professional plan plus credit packs |

### C. Platform admin 🟡

User and role management, dietitian verification queue, eBook catalogue, payments and refunds overview, platform settings (plans, prices, credit costs) and audit-log review. Only `admin` / `super_admin` roles, which are **never** assignable through public sign-up.

## 2. Account types

`customer`, `dietitian`, `admin`, `super_admin`. A user can hold **several roles** (e.g. a dietitian who also tracks their own diet). See [ARCHITECTURE.md](ARCHITECTURE.md#5-authorization-model-planned) and [DATABASE_PLAN.md](DATABASE_PLAN.md).

## 3. Monetization (planned, all values configurable)

| Offering | Billing |
| --- | --- |
| Free customer tier | Free, limited AI usage |
| Pro customer | Monthly / yearly subscription |
| Dietitian professional | Monthly / yearly subscription |
| Optional trial | Up to 14 days, **only if enabled per plan** in configuration |
| AI recipe add-on | Recurring add-on or credit pack |
| Usage-based AI credits | Prepaid packs; text and image generation priced separately |
| eBooks | One-time purchase, lifetime access entitlement |

Rules:

- Prices, plan limits, trial length and credit costs live in the database/config, never in business logic.
- Marketing copy must not promise free trials, instant cancellation or automatic refunds unless the implemented billing rules support it.
- Currency starts with INR. Prices are stored per currency to allow international pricing later.

## 4. Reference products (functional inspiration only)

NutriAdmin, Healthie and Nutrium were named as references. Common workflow categories in this market include client intake questionnaires, meal-plan builders with templates, client food diaries, progress reports, scheduling and practitioner billing. Dietom uses these **categories** only. No designs, text, images or branding are copied, and the UI is original and mobile-first.

> These sites were not browsed during Step 1. Do a deeper feature comparison before designing each dashboard (Steps 6–8).

## 5. Principles

1. **Honest UI:** nothing appears to work until it does.
2. **Privacy first:** health data is visible only to its owner and consented professionals.
3. **Server-side authority:** every permission check happens on the server.
4. **Educational AI:** AI output is labelled and never presented as medical advice.
5. **Mobile-first, accessible, fast:** most users in India browse on phones.
