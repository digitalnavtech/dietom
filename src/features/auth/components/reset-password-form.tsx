"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { TextInputField } from "@/components/forms/text-input-field";
import { resetPasswordAction } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { useAuthFormResult } from "@/features/auth/components/use-auth-form";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schemas";

// Works without the old password: the server accepts it only within the
// session created by a verified recovery link (see resetPasswordAction).
export function ResetPasswordForm() {
  const form = useForm<ResetPasswordInput, unknown, z.output<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const { control, handleSubmit, setError, formState } = form;
  const { result, apply } = useAuthFormResult(setError);

  return (
    <form
      noValidate
      className="space-y-5"
      // On success the action signs out everywhere and redirects to sign-in.
      onSubmit={handleSubmit(async (values) => apply(await resetPasswordAction(values)))}
    >
      <fieldset disabled={formState.isSubmitting} className="space-y-5">
        <TextInputField
          control={control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters, with letters and numbers."
          maxLength={72}
        />
        <TextInputField
          control={control}
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          maxLength={72}
        />
      </fieldset>
      <FormStatus result={result} />
      {!result?.ok && result?.code === "recovery_required" ? (
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
            Request a new reset link
          </Link>
        </p>
      ) : null}
      <SubmitButton pending={formState.isSubmitting} pendingLabel="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
