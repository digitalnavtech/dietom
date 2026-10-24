// Pure parsing of the email-link callback (/auth/confirm), unit-tested.
//
// Supabase email links arrive in one of two shapes:
//   1. ?token_hash=...&type=signup|email|recovery|email_change  (recommended
//      templates; works even if the link is opened on another device)
//   2. ?code=...  (PKCE; the default template; same browser only)
// Supabase may also redirect here with ?error_code=otp_expired etc.
import { getSafeRedirectPath } from "./safe-redirect.ts";

const ALLOWED_OTP_TYPES = ["signup", "email", "recovery", "email_change"] as const;
export type AllowedOtpType = (typeof ALLOWED_OTP_TYPES)[number];

export type ConfirmParams =
  | { kind: "otp"; tokenHash: string; type: AllowedOtpType; next: string }
  | { kind: "code"; code: string; isRecovery: boolean; next: string }
  | { kind: "error"; errorCode: "link_expired" | "link_invalid" };

const TOKEN = /^[A-Za-z0-9._~-]{6,512}$/;

export function parseConfirmParams(params: URLSearchParams): ConfirmParams {
  const supabaseError = params.get("error_code") ?? params.get("error");
  if (supabaseError) {
    return {
      kind: "error",
      errorCode: supabaseError === "otp_expired" ? "link_expired" : "link_invalid",
    };
  }

  const type = params.get("type");
  const isRecovery = type === "recovery";
  const next = getSafeRedirectPath(params.get("next"), isRecovery ? "/reset-password" : "/dashboard");

  const tokenHash = params.get("token_hash");
  if (tokenHash) {
    const allowedType = ALLOWED_OTP_TYPES.find((value) => value === type);
    if (!allowedType || !TOKEN.test(tokenHash)) return { kind: "error", errorCode: "link_invalid" };
    return {
      kind: "otp",
      tokenHash,
      type: allowedType,
      next: allowedType === "recovery" ? "/reset-password" : next,
    };
  }

  const code = params.get("code");
  if (code && TOKEN.test(code)) {
    return { kind: "code", code, isRecovery, next: isRecovery ? "/reset-password" : next };
  }

  return { kind: "error", errorCode: "link_invalid" };
}
