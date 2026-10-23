# Database Plan

> 🟡 **Planned. Nothing here is implemented yet.** Target: Supabase PostgreSQL, Drizzle ORM schema + migrations, Row Level Security (RLS) where user-scoped access applies.

## 1. Conventions

- Primary keys: `uuid` (`gen_random_uuid()`). `users.id` equals Supabase `auth.users.id`.
- Timestamps: `created_at`, `updated_at` (`timestamptz`, UTC). Soft delete (`deleted_at`) only where history matters (users, recipes, plans).
- Money: integer **minor units** (paise) + `currency` (ISO 4217). Never floats.
- Enums: Postgres enums or lookup tables for roles, statuses and providers.
- Every foreign key column gets an index. Composite indexes match the most common filter + sort.
- Names: `snake_case`, plural table names.

## 2. Ownership and tenancy

Three scopes of data:

| Scope | Examples | Who can read |
| --- | --- | --- |
| **Personal** (owner = `user_id`) | nutrition profile, food diary, quiz results, purchases | The owner; a dietitian **only** with active consent for that data category; admins for support (audited) |
| **Organization** (owner = `organization_id`) | dietitian templates, recipe library, questionnaires | Members of that organization |
| **Platform** | plans, prices, eBook catalogue, public recipes | Everyone (read) / admins (write) |

Every solo dietitian gets a personal **organization**, so clinics with several dietitians later need no schema change. Tenancy isolation = every organization-scoped query filters by `organization_id`, enforced in the query layer **and** by RLS.

## 3. Entities

### Identity and access
- **users**: `id` (= auth user), `email`, `full_name`, `phone`, `country`, `locale`, `timezone`, `status`.
- **roles**: `customer`, `dietitian`, `admin`, `super_admin`.
- **user_roles**: `user_id → users`, `role`, `granted_by → users`, `granted_at`. Unique (`user_id`, `role`). Sign-up inserts only `customer` (or a pending dietitian application). Admin roles are granted only by a super admin.
- **permissions / role_permissions** (optional, later): fine-grained permissions if role checks become too coarse.

### Dietitian verification
- **dietitian_profiles**: `user_id` (PK, FK), `registration_body`, `registration_number`, `qualifications`, `bio`, `verification_status` (`pending | approved | rejected | suspended`), `verified_at`, `verified_by`.
- **verification_documents**: `dietitian_user_id`, private storage path, `type`, `uploaded_at`. Files go in a **private** storage bucket and are served via short-lived signed URLs.

### Organizations
- **organizations**: `id`, `name`, `type` (`solo | clinic`), `owner_user_id`.
- **organization_members**: `organization_id`, `user_id`, `member_role` (`owner | dietitian | assistant`). Unique (`organization_id`, `user_id`).

### Dietitian–client relationships and consent
- **client_relationships**: `id`, `organization_id`, `dietitian_user_id`, `client_user_id`, `status` (`invited | active | ended | declined`), `started_at`, `ended_at`. Partial unique index: one **active** relationship per (`dietitian`, `client`).
- **consents**: `relationship_id`, `client_user_id`, `scope` (e.g. `diary.read`, `profile.read`, `plans.write`), `granted_at`, `revoked_at`, `consent_text_version`. Access checks require an active relationship **and** an unrevoked consent for the scope.

### Nutrition
- **nutrition_profiles** (sensitive): `user_id` (PK), `date_of_birth`, `sex`, `height_cm`, `activity_level`, `goals`, `dietary_preferences` (veg, jain, eggetarian, ...), `allergies`, `medical_conditions`.
- **foods**: `id`, `name`, `name_local`, `source`, nutrients per 100 g, `is_verified`. Trigram/full-text index on names.
- **food_diary_entries**: `user_id`, `food_id` (nullable for free text), `meal_type`, `quantity`, `unit`, computed nutrients, `logged_for_date`. Index (`user_id`, `logged_for_date`).

### Recipes
- **recipes**: `id`, `owner_type` (`platform | organization | user`), `owner_id`, `visibility` (`public | org | private`), `title`, `steps`, `servings`, `source` (`manual | ai`), `ai_generation_id`.
- **recipe_ingredients**: `recipe_id`, `food_id`, `quantity`, `unit`, `note`.

### Meal plans
- **meal_plans**: `id`, `owner_type`, `owner_id`, `is_template`, `title`, `duration_days`.
- **meal_plan_items**: `meal_plan_id`, `day_index`, `meal_type`, `recipe_id` or `food_id`, `servings`.
- **meal_plan_assignments**: `meal_plan_id`, `client_user_id`, `relationship_id` (nullable for self-assigned), `start_date`, `status`.

### eBooks
- **ebooks**: `id`, `slug`, `title`, `description`, `cover_path`, private `file_path`, `status`.
- **ebook_entitlements**: `user_id`, `ebook_id`, `order_id`, `granted_at`, `revoked_at`. Unique (`user_id`, `ebook_id`).

### Quizzes
- **quizzes**, **quiz_questions**, **quiz_options**, **quiz_attempts** (`user_id`, `quiz_id`, `score`, `answers jsonb`, `completed_at`).

### Billing
- **products**: what is sold (`pro_customer`, `dietitian_pro`, `ai_addon`, `credit_pack`, `ebook`).
- **plans**: `product_id`, `interval` (`month | year | one_time`), `trial_days` (nullable = no trial), `limits jsonb`, `is_active`.
- **prices**: `plan_id`, `currency`, `amount_minor`, `provider`, `provider_price_id`, `valid_from`, `valid_to`. Prices are data, so changing them needs no deploy.
- **subscriptions**: `user_id` or `organization_id`, `plan_id`, `provider`, `provider_subscription_id` (unique), `status` (`trialing | active | past_due | cancelled | expired`), `current_period_start/end`, `cancel_at_period_end`, `trial_ends_at`.
- **orders**: `user_id`, `status`, `total_minor`, `currency`, `provider`, `provider_order_id` (unique).
- **order_items**: `order_id`, `price_id`, `quantity`, `amount_minor`.
- **payments**: `order_id`/`subscription_id`, `provider_payment_id` (unique), `status`, `amount_minor`, `method`, `captured_at`.
- **refunds**: `payment_id`, `provider_refund_id` (unique), `amount_minor`, `reason`, `status`, `initiated_by`.
- **webhook_events**: `provider`, `provider_event_id` (**unique**, the idempotency key), `type`, `payload jsonb`, `received_at`, `processed_at`, `error`.

### AI usage
- **credit_balances**: `owner_type`, `owner_id`, `balance` (integer credits). Updated only inside a transaction together with a ledger row.
- **credit_ledger**: `owner`, `delta` (+ purchase / − usage), `reason`, `reference_id`, `created_at`. The balance can always be recomputed from the ledger.
- **ai_usage_events**: `user_id`, `organization_id`, `feature` (`recipe | assistant | image`), `model`, `modality` (`text | image | embedding`), `input_tokens`, `output_tokens`, `images`, `cost_minor`, `credits_charged`, `created_at`. Index (`user_id`, `created_at`).
- **knowledge_documents / knowledge_chunks**: RAG sources, `embedding vector` (pgvector, HNSW index), `visibility`, `organization_id`.

### Notifications
- **notifications**: in-app notifications per user, with `read_at`.
- **email_messages**: `user_id`, `template`, `to`, `status` (`queued | sent | delivered | bounced | failed`), `provider_message_id`, `attempts`, `last_error`.
- **notification_preferences**: per-user opt-ins by category.

### Audit
- **audit_logs**: `actor_user_id`, `action`, `target_type`, `target_id`, `organization_id`, `metadata jsonb`, `ip_hash`, `created_at`. Append-only (no UPDATE/DELETE grants). Index (`target_type`, `target_id`) and (`actor_user_id`, `created_at`).

## 4. Key relationships

```
users 1─* user_roles
users 1─1 dietitian_profiles 1─* verification_documents
organizations 1─* organization_members *─1 users
client_relationships: organization + dietitian(user) + client(user) 1─* consents
users 1─1 nutrition_profiles, 1─* food_diary_entries
meal_plans 1─* meal_plan_items; meal_plans 1─* meal_plan_assignments
products 1─* plans 1─* prices; subscriptions *─1 plans
orders 1─* order_items, 1─* payments 1─* refunds
users 1─* ebook_entitlements *─1 ebooks
```

`ON DELETE` rules: user deletion is a soft delete plus anonymisation. Billing records are **kept** (legal/tax retention). Child rows like diary entries cascade only on hard deletion requests.

## 5. Sensitive data handling

- Treat nutrition profiles, medical conditions, diaries, questionnaire answers and verification documents as **sensitive health data**.
- Minimise collection. Medical conditions are optional and explained.
- Encryption at rest (Supabase default). Consider column-level encryption for `medical_conditions` and questionnaire answers.
- Never send sensitive fields to analytics, logs or AI prompts unless the user triggered that AI feature and the data is needed.
- Data export and deletion on request (aligned with India's DPDP Act 2023, and GDPR later for EU users).
- Admin access to personal data is audited.

## 6. RLS strategy

- Enable RLS on all user-facing tables.
- Personal tables: `user_id = auth.uid()`, plus a policy for dietitians via a `SECURITY DEFINER` function `has_client_access(client_id, scope)`.
- Organization tables: `is_org_member(organization_id)`.
- Platform tables: public `SELECT` on published rows only. Writes via server-side service role.
- The server uses the service role only in narrowly scoped server modules (webhooks, jobs, admin). Normal requests use the user's session so RLS applies.
