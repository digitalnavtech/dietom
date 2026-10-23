import { Eye } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export const PREVIEW_MESSAGE =
  "Interface preview — authentication and live data are not connected yet.";

// Shown on every Step 2 dashboard page. role="note" overrides the Alert's
// default role="alert", which would make screen readers interrupt on every page.
export function PreviewNotice({
  message = PREVIEW_MESSAGE,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <Alert
      role="note"
      className={cn("border-warm/40 bg-accent text-accent-foreground", className)}
    >
      <Eye aria-hidden="true" />
      <AlertTitle>Preview only</AlertTitle>
      <AlertDescription className="text-accent-foreground/90">
        {message}
      </AlertDescription>
    </Alert>
  );
}
