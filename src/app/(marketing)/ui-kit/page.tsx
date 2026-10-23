import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PreviewNotice } from "@/components/shared/preview-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dashboardConfigs } from "@/config/dashboard-nav";
import { previewRobots } from "@/features/dashboards/metadata";
import { EbookCatalogDemo } from "@/features/ui-kit/components/ebook-catalog-demo";
import { NewsletterInterestForm } from "@/features/ui-kit/components/newsletter-interest-form";
import { ToastDemo } from "@/features/ui-kit/components/toast-demo";

export const metadata: Metadata = {
  title: "UI kit",
  description: "Internal preview of Dietom's shared interface components.",
  robots: previewRobots,
};

function DemoSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-20">
      <Card>
        <CardHeader>
          <h2 id={id} className="font-heading text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

// The page itself is static. Only the catalog reads `searchParams` (request
// data), so with Cache Components it must sit inside <Suspense>: Next.js
// prerenders everything else and streams the catalog in.
export default function UiKitPage({ searchParams }: PageProps<"/ui-kit">) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">UI kit</h1>
        <p className="text-muted-foreground">
          A working showcase of the shared components built in Step 2. Every
          example here runs locally in your browser; nothing is saved or sent.
        </p>
        <PreviewNotice message="Demonstration page. Forms are UI-only and catalogue entries are fictional." />
      </div>

      <DemoSection
        id="demo-form"
        title="Form validation"
        description="React Hook Form + Zod: required fields, email format, length limits, field-level errors, loading state and toasts."
      >
        <NewsletterInterestForm />
      </DemoSection>

      <DemoSection
        id="demo-toasts"
        title="Toast notifications"
        description="Sonner, rendered once in the root layout. Future real events (account created, payment failed, ...) will reuse these styles."
      >
        <ToastDemo />
      </DemoSection>

      <DemoSection
        id="demo-catalog"
        title="Search, filter, sort & pagination"
        description="State lives in the URL (?q=&category=&sort=&page=), so results are shareable and the Back button works. Data is fictional."
      >
        <Suspense fallback={<LoadingSkeleton variant="table" count={5} label="Loading sample catalogue" />}>
          <EbookCatalogDemo searchParams={searchParams} />
        </Suspense>
      </DemoSection>

      <DemoSection
        id="demo-states"
        title="Loading, empty and error states"
        description="Reusable feedback states for lists and pages."
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-6">
            <LoadingSpinner label="Loading (spinner example)" showLabel />
            <Button disabled>
              <LoadingSpinner label="Saving" />
              Saving…
            </Button>
          </div>
          <LoadingSkeleton variant="cards" count={3} label="Skeleton example" />
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState
              title="No meal plans yet"
              description="Example empty state with a short explanation."
            />
            <ErrorState description="Example error state. Real errors never show technical details." />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        id="demo-dashboards"
        title="Dashboard shells"
        description="One responsive shell with three navigation configurations. Public previews with no authentication yet."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          {Object.values(dashboardConfigs).map((config) => (
            <li key={config.homeHref}>
              <Link
                href={config.homeHref}
                className="block rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {config.label}
                <span className="mt-1 block font-mono text-xs font-normal text-muted-foreground">
                  {config.homeHref}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </DemoSection>
    </div>
  );
}
