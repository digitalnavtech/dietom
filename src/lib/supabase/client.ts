import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

// Supabase client for Client Components (browser).
// Uses only the publishable key, so everything it can reach is limited by RLS.
// Session cookies are managed by @supabase/ssr. createBrowserClient returns
// the same instance on every call in the browser.
//
// The browser is not a trusted place: never make authorization decisions from
// what this client reports. The server verifies identity (src/server/auth).
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createBrowserClient(url, publishableKey);
}
