import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookies";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

// Called by src/proxy.ts on every page request.
//
// Job: keep the session cookie fresh. Supabase access tokens are short-lived;
// when one has expired, getClaims() uses the refresh token to get a new one and
// setAll() writes the new cookies to BOTH the request (so Server Components in
// this same request see the fresh session) and the response (so the browser
// stores it).
//
// It does NOT decide who may see what. That happens on the server, next to
// the data (src/server/auth). The proxy is an optimization, not a security
// boundary.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Signed-out visitors have nothing to refresh. Skip all auth work.
  if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Cache-Control: private, no-store, ... so no CDN or reverse proxy can
        // cache a response carrying one user's session cookie.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Keep this call directly after createServerClient. It verifies the access
  // token's signature (locally, via the project's public JWKS, when asymmetric
  // signing keys are enabled) and refreshes it if expired.
  try {
    await supabase.auth.getClaims();
  } catch (error) {
    // Never log the error object itself: it could carry request details.
    console.error(
      `[auth] session refresh failed: ${error instanceof Error ? error.name : "unknown error"}`,
    );
  }

  return response;
}
