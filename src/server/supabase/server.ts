import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

// Supabase client for Server Components, Server Actions and Route Handlers.
// Create a NEW client for every request (never share one between users). The
// client reads the user's session from the request cookies.
//
// It uses the publishable key, so database calls through it are still subject
// to RLS as the signed-in user. Privileged access goes through Drizzle (getDb).
//
// Reading cookies() makes the caller dynamic: with Cache Components, render the
// component that calls this inside <Suspense>.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. That's fine: the proxy
          // (src/proxy.ts) refreshes the session on every request and writes
          // the cookies there. Server Actions and Route Handlers CAN set them.
        }
      },
    },
  });
}
