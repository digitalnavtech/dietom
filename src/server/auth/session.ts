import "server-only";

import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";

import { getDb } from "@/server/db";
import { dietitianProfiles, profiles, userRoles } from "@/server/db/schema";
import { createSupabaseServerClient } from "@/server/supabase/server";

import { buildAccessContext, type AccessContext } from "./access";
import { AuthenticationRequiredError } from "./errors";
import { verifyUser, type AuthUser } from "./verify-user";

// Server-side identity helpers: the Data Access Layer for "who is this?".
//
// - React cache(): runs at most once per request, however many components ask.
// - Reads cookies, so callers are dynamic: render them inside <Suspense>.
// - Never cached across requests or users (no "use cache" here on purpose).

// The verified user, or null if not signed in (or the session is invalid).
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  // With Partial Prefetching, reading cookies() alone doesn't stop prerendering
  // (Next builds a per-session App Shell). Supabase checks token expiry with
  // Date.now() and calls the Auth server, so stop here and run at request
  // time. This also keeps auth results out of any prefetched/cached shell.
  await connection();
  const supabase = await createSupabaseServerClient();
  return verifyUser(supabase.auth);
});

// Like getAuthUser, but throws when nobody is signed in.
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new AuthenticationRequiredError();
  return user;
}

// Verified user + roles and status loaded from OUR database.
// Uses the privileged Drizzle connection, but only ever for the verified
// user's own id, which comes from the Auth server, never from input.
export const getAccessContext = cache(async (): Promise<AccessContext | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const db = getDb();
  const [profileRows, roleRows, dietitianRows] = await Promise.all([
    db.select({ status: profiles.status }).from(profiles).where(eq(profiles.id, user.id)).limit(1),
    db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, user.id)),
    db
      .select({ status: dietitianProfiles.verificationStatus })
      .from(dietitianProfiles)
      .where(eq(dietitianProfiles.userId, user.id))
      .limit(1),
  ]);

  return buildAccessContext({
    userId: user.id,
    profileStatus: profileRows[0]?.status ?? null,
    roles: roleRows.map((row) => row.role),
    dietitianVerificationStatus: dietitianRows[0]?.status ?? null,
  });
});
