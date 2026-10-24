"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { TextInputField } from "@/components/forms/text-input-field";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { useAuthFormResult } from "@/features/auth/components/use-auth-form";
import { emailOnlySchema, type EmailOnlyInput } from "@/features/auth/schemas";

export function ForgotPasswordForm() {
  const form = useForm<EmailOnlyInput, unknown, z.output<typeof emailOnlySchema>>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });
  const { control, handleSubmit, setError, formState } = form;
  const { result, apply } = useAuthFormResult(setError);

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        const response = await requestPasswordResetAction(values);
        apply(response);
        if (response?.ok) toast.success("If the account exists, a reset link is on its way.");
      })}
    >
      <fieldset disabled={formState.isSubmitting || result?.ok} className="space-y-5">
        <TextInputField control={control} name="email" label="Email" type="email" autoComplete="email" />
      </fieldset>
      <FormStatus result={result} />
      {result?.ok ? null : (
        <SubmitButton pending={formState.isSubmitting} pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      )}
    </form>
  );
}
