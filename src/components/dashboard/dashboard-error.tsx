"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

// Used by each dashboard's error.tsx. Error boundaries must be Client
// Components. Next.js 16 passes `retry`, which re-fetches and re-renders the
// failed segment.
export function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // Placeholder for an error-reporting service (planned). Never show the raw
    // error to users.
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      description="This section couldn't be displayed. Please try again."
      action={
        <Button variant="outline" onClick={() => retry()}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Try again
        </Button>
      }
    />
  );
}
