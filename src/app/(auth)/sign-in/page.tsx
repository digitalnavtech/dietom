import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to Dietom."
      footer={
        <>
          New to Dietom?{" "}
          <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {/* The form reads ?next= and ?status= from the URL (request data). */}
      <Suspense fallback={<LoadingSkeleton count={4} label="Loading sign-in form" />}>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}
