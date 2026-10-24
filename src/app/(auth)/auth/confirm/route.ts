import { NextResponse, type NextRequest } from "next/server";

import { parseConfirmParams } from "@/lib/auth/confirm-params";
import { markPasswordRecovery } from "@/server/auth/recovery";
import { createSupabaseServerClient } from "@/server/supabase/server";

// GET /auth/confirm: target of every Supabase email link (sign-up
// confirmation, email change, password recovery).
//
// Verifies the one-time token with Supabase, which also signs the user in,
// then redirects to a SAFE internal path. Expired or invalid links go to
// /auth/error with an allowlisted code; tokens are never echoed or logged.
function redirectTo(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  // The response sets session cookies: never cache it anywhere.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const params = parseConfirmParams(request.nextUrl.searchParams);
  if (params.kind === "error") {
    return redirectTo(request, `/auth/error?code=${params.errorCode}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } =
    params.kind === "otp"
      ? await supabase.auth.verifyOtp({ type: params.type, token_hash: params.tokenHash })
      : await supabase.auth.exchangeCodeForSession(params.code);

  if (error || !data.user) {
    console.warn(`[auth] confirm failed: ${error?.code ?? "no_user"}`);
    const expired = ["otp_expired", "flow_state_expired"].includes(error?.code ?? "");
    return redirectTo(request, `/auth/error?code=${expired ? "link_expired" : "link_invalid"}`);
  }

  const isRecovery = params.kind === "otp" ? params.type === "recovery" : params.isRecovery;
  if (isRecovery) {
    await markPasswordRecovery(data.user.id);
    return redirectTo(request, "/reset-password");
  }

  return redirectTo(request, params.next);
}
