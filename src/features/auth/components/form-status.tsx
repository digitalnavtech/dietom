import { CircleCheck } from "lucide-react";

import { FormErrorMessage } from "@/components/forms/form-error-message";

// Form-level result: success (role="status", polite) or error (role="alert").
export function FormStatus({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  if (!result.ok) return <FormErrorMessage message={result.message} />;
  return (
    <p
      role="status"
      className="flex gap-2 rounded-lg border border-primary/30 bg-secondary px-3 py-2.5 text-sm text-secondary-foreground"
    >
      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {result.message}
    </p>
  );
}
