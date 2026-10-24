import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { AuthCard } from "@/features/auth/components/auth-card";
import { getAuthErrorPage } from "@/lib/auth/auth-messages";

export const metadata: Metadata = { title: "Link problem" };

// Only allowlisted codes produce specific text, so this URL can't be used to
// show attacker-written messages.
async function AuthErrorContent({ searchParams }: { searchParams: PageProps<"/auth/error">["searchParams"] }) {
  const { code } = await searchParams;
  const page = getAuthErrorPage(Array.isArray(code) ? code[0] : code);

  return (
    <AuthCard title={page.title} description={page.description}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/forgot-password" className={buttonVariants({ variant: "outline", className: "flex-1" })}>
          Reset password
        </Link>
        <Link href="/sign-in" className={buttonVariants({ className: "flex-1" })}>
          Sign in
        </Link>
      </div>
    </AuthCard>
  );
}

export default function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  return (
    <Suspense fallback={<LoadingSkeleton count={3} label="Loading" className="max-w-md" />}>
      <AuthErrorContent searchParams={searchParams} />
    </Suspense>
  );
}
