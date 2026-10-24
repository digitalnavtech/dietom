"use server";

// Auth Server Actions. Each one is a public HTTP endpoint: it validates its
// own input with the shared Zod schema and never trusts the browser.
//
// - Responses don't reveal whether an email has an account (sign-up,
//   resend and forgot-password always answer the same way).
// - Email links are built from NEXT_PUBLIC_SITE_URL, never from the request's
//   Host header, which an attacker could spoof to send phishing links.
// - Supabase also checks every redirect URL against the project's allowlist.
// - redirect() is called outside try/catch: it works by throwing.

import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { authErrorMessage } from "@/lib/auth/auth-messages";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { clearPasswordRecovery, isPasswordRecoveryFor } from "@/server/auth/recovery";
import { getAuthUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import {
  emailOnlySchema,
  fieldErrorsFrom,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ActionResult,
} from "./schemas";

function siteLink(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

const CHECK_INBOX =
  "If this email can be used, we've sent a link to it. Check your inbox (and spam folder).";

function logAuthError(action: string, error: { name?: string; code?: string } | null) {
  // Never log the error object or the email: only safe identifiers.
  if (error) console.warn(`[auth] ${action} failed: ${error.code ?? error.name ?? "unknown"}`);
}

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const { email, password, fullName } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteLink("/auth/confirm?next=/dashboard"),
      // Display name only. The signup trigger copies it to profiles.full_name
      // and NEVER reads roles from metadata: every new user is a "customer".
      data: { full_name: fullName },
    },
  });

  if (error) {
    logAuthError("sign-up", error);
    // Problems the user can fix are shown; "already registered" is hidden
    // behind the same answer as success (no account enumeration).
    if (["weak_password", "over_email_send_rate_limit", "over_request_rate_limit", "signup_disabled"].includes(error.code ?? "")) {
      return { ok: false, message: authErrorMessage(error.code), code: error.code };
    }
    if (!["user_already_exists", "email_exists"].includes(error.code ?? "")) {
      return { ok: false, message: authErrorMessage(undefined) };
    }
  }

  return { ok: true, message: CHECK_INBOX };
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const { email, password, next } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logAuthError("sign-in", error);
    return { ok: false, message: authErrorMessage(error.code), code: error.code };
  }

  redirect(getSafeRedirectPath(next));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  logAuthError("sign-out", error);
  await clearPasswordRecovery();
  redirect("/sign-in?status=signed_out");
}

export async function resendConfirmationAction(input: unknown): Promise<ActionResult> {
  const parsed = emailOnlySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: siteLink("/auth/confirm?next=/dashboard") },
  });
  if (error) {
    logAuthError("resend", error);
    if (error.code?.startsWith("over_")) return { ok: false, message: authErrorMessage(error.code) };
  }
  return { ok: true, message: CHECK_INBOX };
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = emailOnlySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: siteLink("/auth/confirm?type=recovery&next=/reset-password"),
  });
  if (error) {
    logAuthError("password-reset-request", error);
    if (error.code?.startsWith("over_")) return { ok: false, message: authErrorMessage(error.code) };
  }
  // Same answer whether or not the account exists.
  return { ok: true, message: CHECK_INBOX };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // Requires the session created by a verified recovery link (no old password
  // needed) AND the matching recovery marker. A normal signed-in session alone
  // can't change the password here.
  const user = await getAuthUser();
  if (!user || !(await isPasswordRecoveryFor(user.id))) {
    return {
      ok: false,
      code: "recovery_required",
      message: "Your reset link has expired or wasn't opened in this browser. Request a new one.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logAuthError("password-update", error);
    return { ok: false, message: authErrorMessage(error.code), code: error.code };
  }

  // Sign out everywhere (including any attacker session) and start fresh.
  await clearPasswordRecovery();
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  logAuthError("sign-out-after-reset", signOutError);
  redirect("/sign-in?status=password_updated");
}
