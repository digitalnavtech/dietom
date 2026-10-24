import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

// Reached from the reset email via /auth/confirm, which verifies the link and
// marks this browser for recovery. The server re-checks both on submit.
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      description="You'll be signed out on all devices afterwards and can sign in with the new password."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
