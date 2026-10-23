import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/update-session";

// Next.js 16 "Proxy" (formerly Middleware). Runs before every matched request
// on the Node.js runtime.
//
// Phase 4A: only refreshes the Supabase session. No redirects or route
// protection yet. Those come in Phase 4B, and even then the real checks run
// on the server (layouts, actions, data access), not here.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static files, images and metadata routes, which never
    // need a session.
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
