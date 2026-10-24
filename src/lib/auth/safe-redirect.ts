// Pure helper (no imports), unit-tested in safe-redirect.test.ts.
//
// "Where to go after sign-in" usually arrives in the URL (?next=/dashboard),
// which an attacker controls. Without checks, a link like
//   /sign-in?next=https://evil.example
// would send a freshly signed-in user to a phishing site (an "open redirect").
//
// Only same-site paths are accepted. Anything doubtful falls back to a safe default.

const MAX_LENGTH = 512;
const BASE = "http://dietom.internal";

export function getSafeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();

  if (
    !candidate ||
    candidate.length > MAX_LENGTH ||
    !candidate.startsWith("/") ||
    // "//evil.com" and "/\evil.com" are protocol-relative URLs in browsers.
    candidate.startsWith("//") ||
    candidate.startsWith("/\\") ||
    // Control characters / whitespace can smuggle a different URL past parsers.
    /[\u0000-\u001f\u007f\s\\]/.test(candidate)
  ) {
    return fallback;
  }

  // Encoded tricks like "/%2F%2Fevil.com" decode to "//evil.com".
  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }
  if (decoded.startsWith("//") || decoded.startsWith("/\\") || /[\u0000-\u001f\u007f]/.test(decoded)) {
    return fallback;
  }

  // Final check: resolving against a dummy origin must stay on that origin.
  let url: URL;
  try {
    url = new URL(candidate, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;

  // Never bounce back into the auth flow itself (avoids loops).
  if (/^\/(sign-in|sign-up|auth\/)/.test(url.pathname)) return fallback;

  return `${url.pathname}${url.search}${url.hash}`;
}
