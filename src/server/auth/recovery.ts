import "server-only";

import { cookies } from "next/headers";

// Password reset safeguard.
//
// Supabase lets any signed-in session change its password without the old one.
// To keep /reset-password for real reset flows only, /auth/confirm sets this
// short-lived, httpOnly cookie after a recovery link is verified, bound to
// that user id. The reset action requires it and deletes it afterwards.
// (httpOnly: page scripts can't read or forge it.)
const RECOVERY_COOKIE = "dietom-recovery";
const RECOVERY_MAX_AGE_SECONDS = 15 * 60;

export async function markPasswordRecovery(userId: string): Promise<void> {
  const store = await cookies();
  store.set(RECOVERY_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: RECOVERY_MAX_AGE_SECONDS,
  });
}

export async function isPasswordRecoveryFor(userId: string): Promise<boolean> {
  const store = await cookies();
  return store.get(RECOVERY_COOKIE)?.value === userId;
}

export async function clearPasswordRecovery(): Promise<void> {
  const store = await cookies();
  store.delete(RECOVERY_COOKIE);
}
