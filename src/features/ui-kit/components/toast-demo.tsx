"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Local demo of each toast type. Every message says it's a demo, so no one
// mistakes it for a real event.
export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Demo: success", {
            description: "Used when an action completes.",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Demo: error", {
            description: "Used when something fails. Says what to do next.",
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Demo: information", {
            description: "Neutral updates that need no action.",
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Demo: warning", {
            description: "Something needs attention soon.",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
            loading: "Demo: working…",
            success: "Demo: finished",
            error: "Demo: failed",
          })
        }
      >
        Loading → success
      </Button>
    </div>
  );
}
