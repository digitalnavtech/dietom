import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  pending,
  children,
  pendingLabel,
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel: string;
}) {
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-10 w-full">
      {pending ? <LoadingSpinner label={pendingLabel} /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
