// Pure mapping from Supabase Auth error codes to safe, user-facing text.
// Raw provider messages are never shown: they can be confusing and can leak
// details (e.g. whether an account exists).

export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
    case "user_not_found":
      return "Email or password is incorrect.";
    case "email_not_confirmed":
      return "Please confirm your email address first. Check your inbox for the confirmation link.";
    case "weak_password":
      return "Choose a stronger password: at least 8 characters with letters and numbers.";
    case "same_password":
      return "Your new password must be different from your current one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "user_banned":
      return "This account can't sign in right now. Please contact support.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "New registrations are temporarily unavailable.";
    case "session_expired":
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
      return "Your session has expired. Please sign in again.";
    case "otp_expired":
      return "This link has expired. Please request a new one.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// Codes accepted by /auth/error?code=... Anything else shows the generic text,
// so the URL can't be used to display attacker-written messages.
export const AUTH_ERROR_PAGES = {
  link_expired: {
    title: "This link has expired",
    description: "Confirmation and reset links are valid for a limited time. Request a new one below.",
  },
  link_invalid: {
    title: "This link isn't valid",
    description: "It may have been used already or copied incompletely. Request a new one below.",
  },
  session_expired: {
    title: "Your session has expired",
    description: "For your security, please sign in again.",
  },
  recovery_required: {
    title: "Open your reset link first",
    description: "To set a new password, use the link from the password reset email.",
  },
} as const;

export type AuthErrorPageCode = keyof typeof AUTH_ERROR_PAGES;

export function getAuthErrorPage(code: unknown) {
  const key = Object.keys(AUTH_ERROR_PAGES).find((value) => value === code) as
    | AuthErrorPageCode
    | undefined;
  return key
    ? AUTH_ERROR_PAGES[key]
    : { title: "Something went wrong", description: "Please try again, or request a new link." };
}

// Status banners on /sign-in (?status=...). Allowlisted for the same reason.
export const SIGN_IN_STATUS = {
  signed_out: "You've been signed out.",
  email_confirmed: "Your email is confirmed. Please sign in.",
  password_updated: "Your password has been updated. Please sign in with your new password.",
  session_expired: "Your session has expired. Please sign in again.",
} as const;

export function getSignInStatus(code: unknown): string | null {
  const key = Object.keys(SIGN_IN_STATUS).find((value) => value === code) as
    | keyof typeof SIGN_IN_STATUS
    | undefined;
  return key ? SIGN_IN_STATUS[key] : null;
}
