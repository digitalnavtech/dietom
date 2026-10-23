"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormErrorMessage } from "@/components/forms/form-error-message";
import { SelectField } from "@/components/forms/select-field";
import { TextInputField } from "@/components/forms/text-input-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  INTEREST_OPTIONS,
  newsletterInterestSchema,
  type NewsletterInterestInput,
  type NewsletterInterestValues,
} from "@/features/ui-kit/schemas";

const defaultValues: NewsletterInterestInput = {
  name: "",
  email: "",
  interest: "",
  message: "",
  simulateFailure: false,
};

// Fake network delay so the loading state is visible. Nothing is sent anywhere.
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// UI-ONLY DEMO: validates input and shows feedback, but does not store, send
// or email anything. It is intentionally not wired to any server action.
export function NewsletterInterestForm() {
  const [formError, setFormError] = useState<string>();

  const form = useForm<NewsletterInterestInput, unknown, NewsletterInterestValues>({
    resolver: zodResolver(newsletterInterestSchema),
    defaultValues,
    // Validate a field when it loses focus, then re-check on every change.
    mode: "onTouched",
  });
  const { control, handleSubmit, reset, register, formState } = form;
  const { isSubmitting } = formState;

  async function onValid(values: NewsletterInterestValues) {
    setFormError(undefined);
    await wait(1200);

    if (values.simulateFailure) {
      const message = "The demo submission failed on purpose. Nothing was sent.";
      setFormError(message);
      toast.error("Submission failed (simulated)", { description: message });
      return;
    }

    toast.success("Form is valid", {
      description: `Thanks, ${values.name}. This is a UI-only demo, so nothing was saved or sent.`,
    });
    reset(defaultValues);
  }

  function onInvalid() {
    toast.error("Please fix the highlighted fields", {
      description: "Each field explains what's needed.",
    });
  }

  return (
    <form
      noValidate // Zod shows our own accessible messages instead of browser bubbles.
      onSubmit={handleSubmit(onValid, onInvalid)}
      aria-describedby="newsletter-form-note"
      className="space-y-6"
    >
      <p id="newsletter-form-note" className="text-sm text-muted-foreground">
        UI-only example. Your entries stay in this browser tab and are never
        stored or sent.
      </p>

      {/* fieldset disabled = every control is disabled while submitting. */}
      <fieldset disabled={isSubmitting} className="space-y-6">
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <TextInputField
            control={control}
            name="name"
            label="Name"
            autoComplete="name"
            placeholder="Your name"
            maxLength={60}
          />
          <TextInputField
            control={control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
          />
        </FieldGroup>

        <SelectField
          control={control}
          name="interest"
          label="What describes you best?"
          options={[...INTEREST_OPTIONS]}
          placeholder="Choose one"
        />

        <TextareaField
          control={control}
          name="message"
          label="Anything you'd like to see in Dietom?"
          labelHint="(optional)"
          description="Please don't include health or medical details."
          maxLength={280}
          rows={3}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            {...register("simulateFailure")}
          />
          Simulate a failed submission (to see the error state)
        </label>
      </fieldset>

      <FormErrorMessage message={formError} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ConfirmDialog
          trigger={
            <Button type="button" variant="ghost" disabled={isSubmitting}>
              Clear form
            </Button>
          }
          title="Clear the form?"
          description="This empties every field. Nothing has been saved, so there's nothing else to undo."
          confirmLabel="Clear form"
          destructive
          onConfirm={() => {
            reset(defaultValues);
            setFormError(undefined);
            toast.info("Form cleared");
          }}
        />
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-10 px-5">
          {isSubmitting ? <LoadingSpinner label="Submitting" /> : null}
          {isSubmitting ? "Checking…" : "Submit (demo)"}
        </Button>
      </div>
    </form>
  );
}
