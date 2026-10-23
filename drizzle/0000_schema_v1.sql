CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('customer', 'dietitian', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."consent_scope" AS ENUM('profile.read', 'diary.read', 'plans.write');--> statement-breakpoint
CREATE TYPE "public"."organization_member_role" AS ENUM('owner', 'dietitian', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('solo', 'clinic');--> statement-breakpoint
CREATE TYPE "public"."relationship_status" AS ENUM('invited', 'active', 'ended', 'declined');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "dietitian_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"registration_body" text,
	"registration_number" text,
	"qualifications" text,
	"bio" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"decision_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dietitian_profiles_bio_length" CHECK (char_length("dietitian_profiles"."bio") <= 2000),
	CONSTRAINT "dietitian_profiles_approved_has_date" CHECK ("dietitian_profiles"."verification_status" <> 'approved' or "dietitian_profiles"."verified_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "dietitian_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"phone" text,
	"country" text DEFAULT 'IN' NOT NULL,
	"locale" text DEFAULT 'en-IN' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_full_name_length" CHECK (char_length("profiles"."full_name") <= 120),
	CONSTRAINT "profiles_phone_format" CHECK ("profiles"."phone" ~ '^\+[1-9][0-9]{6,14}$'),
	CONSTRAINT "profiles_country_format" CHECK ("profiles"."country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role" "app_role" NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization_members" (
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"member_role" "organization_member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_pkey" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "organization_type" DEFAULT 'solo' NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_length" CHECK (char_length("organizations"."name") between 1 and 120)
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dietitian_user_id" uuid NOT NULL,
	"client_user_id" uuid NOT NULL,
	"status" "relationship_status" DEFAULT 'invited' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_relationships_id_client_unique" UNIQUE("id","client_user_id"),
	CONSTRAINT "client_relationships_not_self" CHECK ("client_relationships"."dietitian_user_id" <> "client_relationships"."client_user_id"),
	CONSTRAINT "client_relationships_active_has_start" CHECK ("client_relationships"."status" <> 'active' or "client_relationships"."started_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "client_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"client_user_id" uuid NOT NULL,
	"scope" "consent_scope" NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"consent_text_version" text NOT NULL,
	CONSTRAINT "consents_revoked_after_granted" CHECK ("consents"."revoked_at" is null or "consents"."revoked_at" >= "consents"."granted_at")
);
--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"organization_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dietitian_profiles" ADD CONSTRAINT "dietitian_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietitian_profiles" ADD CONSTRAINT "dietitian_profiles_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_profiles_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_user_id_profiles_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_relationships" ADD CONSTRAINT "client_relationships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_relationships" ADD CONSTRAINT "client_relationships_dietitian_user_id_profiles_id_fk" FOREIGN KEY ("dietitian_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_relationships" ADD CONSTRAINT "client_relationships_client_user_id_profiles_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_relationship_client_fk" FOREIGN KEY ("relationship_id","client_user_id") REFERENCES "public"."client_relationships"("id","client_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dietitian_profiles_registration_unique" ON "dietitian_profiles" USING btree ("registration_body","registration_number") WHERE "dietitian_profiles"."registration_number" is not null;--> statement-breakpoint
CREATE INDEX "dietitian_profiles_status_idx" ON "dietitian_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "dietitian_profiles_verified_by_idx" ON "dietitian_profiles" USING btree ("verified_by");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_roles_granted_by_idx" ON "user_roles" USING btree ("granted_by");--> statement-breakpoint
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizations_owner_user_id_idx" ON "organizations" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_relationships_open_pair_unique" ON "client_relationships" USING btree ("dietitian_user_id","client_user_id") WHERE "client_relationships"."status" in ('invited', 'active');--> statement-breakpoint
CREATE INDEX "client_relationships_client_idx" ON "client_relationships" USING btree ("client_user_id");--> statement-breakpoint
CREATE INDEX "client_relationships_dietitian_idx" ON "client_relationships" USING btree ("dietitian_user_id","status");--> statement-breakpoint
CREATE INDEX "client_relationships_organization_idx" ON "client_relationships" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consents_active_scope_unique" ON "consents" USING btree ("relationship_id","scope") WHERE "consents"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "consents_relationship_idx" ON "consents" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "consents_client_idx" ON "consents" USING btree ("client_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_created_idx" ON "audit_logs" USING btree ("organization_id","created_at");