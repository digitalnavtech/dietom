import { SectionHeading } from "@/components/shared/section-heading";
import { FeatureCard } from "@/features/marketing/components/feature-card";
import {
  customerFeatures,
  dietitianFeatures,
  safetyPoints,
} from "@/features/marketing/content";

export function CustomerFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-20 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="features-title"
          eyebrow="For individuals"
          title="Everything you need to eat well, in one place"
          description="These are the features we're building for customers. Each one is marked as planned until it actually works."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {customerFeatures.map((feature) => (
            <li key={feature.title}>
              <FeatureCard feature={feature} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function DietitianFeatures() {
  return (
    <section
      id="dietitians"
      aria-labelledby="dietitians-title"
      className="scroll-mt-20 bg-secondary/40 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="dietitians-title"
          eyebrow="For dietitians"
          title="A focused workspace for your practice"
          description="Verified dietitians will get a separate professional dashboard to manage consenting clients, plans and progress."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dietitianFeatures.map((feature) => (
            <li key={feature.title}>
              <FeatureCard feature={feature} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SafetySection() {
  return (
    <section
      id="safety"
      aria-labelledby="safety-title"
      className="scroll-mt-20 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="safety-title"
          eyebrow="Trust & safety"
          title="Your health data deserves serious care"
          description="These principles shape how Dietom is being designed and built from the first line of code."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {safetyPoints.map((point) => (
            <li key={point.title}>
              <FeatureCard feature={point} showStatus={false} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
