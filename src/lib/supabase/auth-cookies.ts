// Pure helper (no imports) so it can be unit-tested with Node's test runner.
//
// @supabase/ssr stores the session in cookies named
//   sb-<project-ref>-auth-token            (whole session)
//   sb-<project-ref>-auth-token.0, .1, ... (split into chunks when large)
//   sb-<project-ref>-auth-token-code-verifier (PKCE, during sign-in flows)
const SUPABASE_AUTH_COOKIE = /^sb-[a-z0-9]+-auth-token(?:\.\d+|-code-verifier)?$/;

export function isSupabaseAuthCookie(name: string): boolean {
  return SUPABASE_AUTH_COOKIE.test(name);
}

// True when the request carries any Supabase auth cookie. Requests without one
// can't have a session to refresh, so the proxy skips them.
export function hasSupabaseAuthCookie(cookies: ReadonlyArray<{ name: string }>): boolean {
  return cookies.some((cookie) => isSupabaseAuthCookie(cookie.name));
}
