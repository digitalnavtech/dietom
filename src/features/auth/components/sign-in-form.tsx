"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { TextInputField } from "@/components/forms/text-input-field";
import { Button } from "@/components/ui/button";
import { resendConfirmationAction, signInAction } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { useAuthFormResult } from "@/features/auth/components/use-auth-form";
import { signInSchema, type SignInInput } from "@/features/auth/schemas";
import { getSignInStatus } from "@/lib/auth/auth-messages";

// Reads ?next= and ?status= from the URL. Both are untrusted: `status` must be
// an allowlisted code, and `next` is re-validated on the server before redirecting.
export function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const status = getSignInStatus(searchParams.get("status"));

  const form = useForm<SignInInput, unknown, z.output<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
    mode: "onTouched",
  });
  const { control, handleSubmit, setError, formState, getValues } = form;
  const { result, apply } = useAuthFormResult(setError);
  const [resending, startResend] = useTransition();
  const [resent, setResent] = useState(false);

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        setResent(false);
        // On success the action redirects and this call never returns a value.
        apply(await signInAction({ ...values, next }));
      })}
    >
      {status ? (
        <p role="status" className="flex gap-2 rounded-lg border bg-muted px-3 py-2.5 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {status}
        </p>
      ) : null}

      <fieldset disabled={formState.isSubmitting} className="space-y-5">
        <TextInputField control={control} name="email" label="Email" type="email" autoComplete="email" />
        <TextInputField
          control={control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          maxLength={72}
        />
      </fieldset>

      <div className="flex justify-end text-sm">
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          Forgot your password?
        </Link>
      </div>

      <FormStatus result={result} />

      {!result?.ok && result?.code === "email_not_confirmed" ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resending || resent}
          onClick={() =>
            startResend(async () => {
              const response = await resendConfirmationAction({ email: getValues("email") });
              if (response.ok) {
                setResent(true);
                toast.success("Confirmation email requested. Check your inbox.");
              } else {
                toast.error(response.message);
              }
            })
          }
        >
          {resent ? "Confirmation email requested" : resending ? "Sending…" : "Resend confirmation email"}
        </Button>
      ) : null}

      <SubmitButton pending={formState.isSubmitting} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
