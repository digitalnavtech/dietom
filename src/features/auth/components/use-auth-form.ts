"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ActionResult } from "@/features/auth/schemas";

// Shared submit handling for auth forms: shows server-side field errors on
// the matching inputs and keeps the form-level result for <FormStatus>.
// Actions that succeed by redirecting resolve with no value; that's fine.
export function useAuthFormResult<T extends FieldValues>(setError: UseFormSetError<T>) {
  const [result, setResult] = useState<ActionResult | null>(null);

  function apply(next: ActionResult | undefined) {
    if (!next) return;
    setResult(next);
    if (!next.ok && next.fieldErrors) {
      for (const [name, message] of Object.entries(next.fieldErrors)) {
        setError(name as Path<T>, { type: "server", message });
      }
    }
  }

  return { result, setResult, apply };
}
