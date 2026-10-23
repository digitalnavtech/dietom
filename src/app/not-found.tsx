import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

// Shown for any unknown URL, including planned routes that aren't built yet.
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center"
    >
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-muted-foreground">
        This page doesn&apos;t exist, or it&apos;s part of Dietom that we
        haven&apos;t built yet.
      </p>
      <Link href="/" className={`${buttonVariants()} mt-8`}>
        Back to home
      </Link>
    </main>
  );
}
