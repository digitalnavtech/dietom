import { CircleUser } from "lucide-react";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { getAuthUser } from "@/server/auth/session";

// Signed-in user + sign-out in the dashboard header. Reads cookies, so the
// shell renders it inside <Suspense>. Shows only the user's own email.
export async function UserMenu() {
  const user = await getAuthUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      <span className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
        <CircleUser className="size-4" aria-hidden="true" />
        <span className="max-w-48 truncate">{user.email}</span>
      </span>
      <SignOutButton />
    </div>
  );
}
