"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextInputField } from "@/components/forms/text-input-field";
import { signUpAction } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { useAuthFormResult } from "@/features/auth/components/use-auth-form";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";
import type { z } from "zod";

export function SignUpForm() {
  const form = useForm<SignUpInput, unknown, z.output<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const { control, handleSubmit, setError, formState } = form;
  const { result, apply } = useAuthFormResult(setError);

  if (result?.ok) {
    return (
      <div className="space-y-4 text-center" role="status">
        <MailCheck className="mx-auto size-10 text-primary" aria-hidden="true" />
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">{result.message}</p>
        <p className="text-sm text-muted-foreground">
          Open the confirmation link to activate your account, then{" "}
          <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        const response = await signUpAction(values);
        apply(response);
        if (response?.ok) toast.success("Account created. Check your email to confirm it.");
      })}
    >
      <fieldset disabled={formState.isSubmitting} className="space-y-5">
        <TextInputField control={control} name="fullName" label="Full name" autoComplete="name" maxLength={120} />
        <TextInputField control={control} name="email" label="Email" type="email" autoComplete="email" />
        <TextInputField
          control={control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters, with letters and numbers."
          maxLength={72}
        />
        <TextInputField
          control={control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          maxLength={72}
        />
      </fieldset>
      <FormStatus result={result} />
      <SubmitButton pending={formState.isSubmitting} pendingLabel="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-xs text-muted-foreground">
        New accounts start as customer accounts. Dietitian access requires a separate professional
        verification.
      </p>
    </form>
  );
}
