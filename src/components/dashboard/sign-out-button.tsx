import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";

// A real <form> posting to a Server Action: works without JavaScript and can't
// be triggered by a simple link (no GET sign-out).
export function SignOutButton({
  variant = "ghost",
  label = "Sign out",
}: {
  variant?: "default" | "ghost" | "outline";
  label?: string;
}) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant={variant}>
        <LogOut data-icon="inline-start" aria-hidden="true" />
        {label}
      </Button>
    </form>
  );
}
