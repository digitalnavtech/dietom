import type { NextRequest } from "next/server";

import { isProtectedPath } from "@/lib/auth/area-access";
import { redirectWithSession, updateSession } from "@/lib/supabase/update-session";

// Next.js 16 "Proxy" (formerly Middleware). Runs before every matched request
// on the Node.js runtime.
//
// 1. Refreshes the Supabase session (always).
// 2. OPTIMISTIC redirects only, for a smoother experience:
//    - no valid session on /dashboard, /dietitian, /admin → /sign-in?next=...
//    - valid session on /sign-in or /sign-up → /dashboard
// These are conveniences, NOT security: every dashboard page and every
// protected action checks identity and roles again on the server.
export async function proxy(request: NextRequest) {
  const session = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !session.hasSession) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    // Had cookies but no valid session: it expired or was revoked.
    if (session.hadAuthCookie) url.searchParams.set("status", "session_expired");
    return redirectWithSession(session, url);
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && session.hasSession) {
    return redirectWithSession(session, new URL("/dashboard", request.url));
  }

  return session.response;
}

export const config = {
  matcher: [
    // Everything except static files, images and metadata routes, which never
    // need a session.
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
