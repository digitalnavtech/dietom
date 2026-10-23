"use client";

import { FieldError } from "@/components/ui/field";

// Renders a validation message with role="alert" so screen readers announce it.
// Used per field (by FormField) and for form-level errors (e.g. "Submission failed").
export function FormErrorMessage({
  id,
  message,
  className,
}: {
  id?: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <FieldError id={id} className={className}>
      {message}
    </FieldError>
  );
}
