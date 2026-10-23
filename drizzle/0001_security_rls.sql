-- ============================================================================
-- Dietom migration 0001: security layer for schema v1
-- ============================================================================
-- Hand-written (drizzle-kit generate --custom). Contains:
--   1. A private schema for helper functions (not exposed by the Data API)
--   2. updated_at triggers
--   3. The signup trigger: every new auth user gets a profile + "customer" role
--   4. Security-definer helper functions used by policies
--   5. Table privileges for the anon / authenticated roles
--   6. Row Level Security policies (read-side; all writes go through the server)
--   7. Append-only protection for audit_logs
--
-- Access model:
--   * anon (signed-out visitors using the publishable key): no access to any table.
--   * authenticated (signed-in users via the Data API): may READ only their own
--     rows, rows of organizations they belong to, and client data they hold an
--     active consent for. The only write allowed is editing a few columns of
--     their own profile.
--   * The Next.js server (Drizzle, `postgres` role) bypasses RLS and is
--     responsible for authorization in code. See src/server/db/index.ts.
-- ============================================================================

-- 1. Private schema ----------------------------------------------------------
-- Supabase only exposes `public` (and `graphql_public`) through its API, so
-- functions here can't be called directly by clients with arbitrary arguments.
CREATE SCHEMA IF NOT EXISTS private;
--> statement-breakpoint
REVOKE ALL ON SCHEMA private FROM PUBLIC;
--> statement-breakpoint
-- Policies run as the querying role, so `authenticated` must reach the helpers.
GRANT USAGE ON SCHEMA private TO authenticated;
--> statement-breakpoint

-- 2. updated_at trigger ------------------------------------------------------
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.dietitian_profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.client_relationships
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
--> statement-breakpoint

-- 3. Signup trigger ----------------------------------------------------------
-- Runs inside the same transaction as the auth.users insert: if it fails, the
-- signup fails, so it is kept deliberately small.
-- SECURITY: the role is ALWAYS 'customer'. raw_user_meta_data is controlled by
-- whoever signs up, so it is used only for a display name (trimmed, max 120
-- characters) and NEVER for roles or permissions.
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NULLIF(left(btrim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), 120), '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');

  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
--> statement-breakpoint

-- 4. Helper functions for policies ---------------------------------------------
-- SECURITY DEFINER: they read membership/consent tables with the owner's rights,
-- which avoids infinite recursion (a policy on table X querying table X) and
-- keeps policies short. Each one only answers "yes/no" about auth.uid().
-- STABLE + `(select auth.uid())` lets Postgres evaluate them once per query.

CREATE OR REPLACE FUNCTION private.has_role(p_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = p_role
      AND p.status = 'active'
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.is_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_organization_id
      AND m.user_id = (SELECT auth.uid())
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.is_relationship_dietitian(p_relationship_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_relationships r
    WHERE r.id = p_relationship_id
      AND r.dietitian_user_id = (SELECT auth.uid())
  );
$$;
--> statement-breakpoint
-- The core consent rule. A dietitian may access a client's data for a scope only if:
--   * the dietitian is verified (approved) and their account is active,
--   * the relationship is active, and
--   * the client has an un-revoked consent for exactly that scope.
CREATE OR REPLACE FUNCTION private.has_client_access(
  p_client_id uuid,
  p_scope public.consent_scope
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_relationships r
    JOIN public.consents c
      ON c.relationship_id = r.id
     AND c.client_user_id = r.client_user_id
    JOIN public.dietitian_profiles d ON d.user_id = r.dietitian_user_id
    JOIN public.profiles dp ON dp.id = r.dietitian_user_id
    WHERE r.client_user_id = p_client_id
      AND r.dietitian_user_id = (SELECT auth.uid())
      AND r.status = 'active'
      AND c.scope = p_scope
      AND c.revoked_at IS NULL
      AND d.verification_status = 'approved'
      AND dp.status = 'active'
  );
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION
  private.has_role(public.app_role),
  private.is_org_member(uuid),
  private.is_relationship_dietitian(uuid),
  private.has_client_access(uuid, public.consent_scope)
FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION
  private.has_role(public.app_role),
  private.is_org_member(uuid),
  private.is_relationship_dietitian(uuid),
  private.has_client_access(uuid, public.consent_scope)
TO authenticated;
--> statement-breakpoint

-- 5. Table privileges ----------------------------------------------------------
-- Supabase grants ALL on new public tables to anon and authenticated by default.
-- RLS already blocks rows without a policy, but we also remove the verbs we never
-- want (defence in depth): a forgotten policy can't accidentally allow writes.
REVOKE ALL ON TABLE
  public.profiles,
  public.user_roles,
  public.dietitian_profiles,
  public.organizations,
  public.organization_members,
  public.client_relationships,
  public.consents,
  public.audit_logs
FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON TABLE
  public.profiles,
  public.user_roles,
  public.dietitian_profiles,
  public.organizations,
  public.organization_members,
  public.client_relationships,
  public.consents
TO authenticated;
--> statement-breakpoint
-- Column-level grant: users may edit these profile fields only. They can never
-- change `status`, `deleted_at` or timestamps, even on their own row.
GRANT UPDATE (full_name, phone, country, locale, timezone)
  ON TABLE public.profiles TO authenticated;
--> statement-breakpoint
-- audit_logs: no grants at all for anon/authenticated. Server-only.

-- 6. Row Level Security policies ---------------------------------------------
-- (RLS was enabled on every table in migration 0000.)
-- Policies are permissive and OR-ed together per command.

-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));
--> statement-breakpoint
CREATE POLICY "profiles_select_consented_dietitian" ON public.profiles
  FOR SELECT TO authenticated
  USING (private.has_client_access(id, 'profile.read'));
--> statement-breakpoint
CREATE POLICY "profiles_update_own_active" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) AND status = 'active')
  WITH CHECK (id = (SELECT auth.uid()));
--> statement-breakpoint

-- user_roles: see your own roles (the UI needs this); never write.
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
--> statement-breakpoint

-- dietitian_profiles: see your own application/verification state.
CREATE POLICY "dietitian_profiles_select_own" ON public.dietitian_profiles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
--> statement-breakpoint

-- organizations / members: visible to members of that organization only.
CREATE POLICY "organizations_select_member" ON public.organizations
  FOR SELECT TO authenticated
  USING (private.is_org_member(id));
--> statement-breakpoint
CREATE POLICY "organization_members_select_member" ON public.organization_members
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
--> statement-breakpoint

-- client_relationships: visible to the two people in it.
CREATE POLICY "client_relationships_select_participant" ON public.client_relationships
  FOR SELECT TO authenticated
  USING (
    client_user_id = (SELECT auth.uid())
    OR dietitian_user_id = (SELECT auth.uid())
  );
--> statement-breakpoint

-- consents: the client sees what they granted; the dietitian sees what they received.
CREATE POLICY "consents_select_participant" ON public.consents
  FOR SELECT TO authenticated
  USING (
    client_user_id = (SELECT auth.uid())
    OR private.is_relationship_dietitian(relationship_id)
  );
--> statement-breakpoint

-- audit_logs: intentionally NO policies → no Data API access.

-- 7. Append-only audit log -------------------------------------------------------
-- Blocks UPDATE, DELETE and TRUNCATE for every role, including the server.
-- A future retention job must drop this trigger explicitly, in its own
-- reviewed migration.
CREATE OR REPLACE FUNCTION private.prevent_audit_log_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (% is not allowed)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION private.prevent_audit_log_changes();
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON public.audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_audit_log_changes();
