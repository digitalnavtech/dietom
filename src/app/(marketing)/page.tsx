import type { Metadata } from "next";

import { DashboardsOverview } from "@/features/marketing/components/dashboards-overview";
import {
  CustomerFeatures,
  DietitianFeatures,
  SafetySection,
} from "@/features/marketing/components/feature-sections";
import { Hero } from "@/features/marketing/components/hero";

// Canonical URL strategy: each indexable public page declares its own path.
// It resolves against metadataBase (NEXT_PUBLIC_SITE_URL), e.g. https://<domain>/.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Server Component (the default): rendered to static HTML at build time.
// The page only composes sections; their content lives in features/marketing.
export default function HomePage() {
  return (
    <>
      <Hero />
      <CustomerFeatures />
      <DietitianFeatures />
      <DashboardsOverview />
      <SafetySection />
    </>
  );
}
