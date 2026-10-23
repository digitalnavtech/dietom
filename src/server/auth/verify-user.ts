// Pure identity verification (only type imports), unit-tested in verify-user.test.ts.
import type { User } from "@supabase/supabase-js";

// The ONLY user shape the app passes around. Deliberately narrow:
// user_metadata is editable by the user themself, and app_metadata is not
// where Dietom stores roles, so neither is copied here. Roles come from the
// database (see access.ts).
export type AuthUser = {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
};

// Structural type of the one auth method we rely on, so tests can pass a fake.
export type GetUserAuthClient = {
  getUser(): Promise<{ data: { user: User | null }; error: unknown }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Asks the Supabase Auth server who the current user is. Unlike getSession(),
// which only decodes the cookie, getUser() validates the token with the Auth
// server, so a deleted, banned or signed-out user is not accepted.
//
// Fails closed: any error, unexpected shape or network failure means
// "not signed in", never "signed in as someone".
export async function verifyUser(auth: GetUserAuthClient): Promise<AuthUser | null> {
  let result: Awaited<ReturnType<GetUserAuthClient["getUser"]>>;
  try {
    result = await auth.getUser();
  } catch {
    return null;
  }

  const user = result.error ? null : result.data.user;
  if (!user || typeof user.id !== "string" || !UUID.test(user.id)) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at),
  };
}
