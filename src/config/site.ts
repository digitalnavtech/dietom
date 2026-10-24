// Single source of truth for brand text and navigation.
// Components read from here so copy changes never require hunting through JSX.

const DEFAULT_SITE_URL = "http://localhost:3000";

// The public URL is configuration, not code: set NEXT_PUBLIC_SITE_URL per
// environment (see .env.example). Used for canonical URLs, sitemap and Open Graph.
// An invalid value fails the build loudly instead of shipping broken metadata.
function resolveSiteUrl(): URL {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return new URL(DEFAULT_SITE_URL);
  try {
    return new URL(value);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an absolute URL such as https://example.com (got "${value}")`,
    );
  }
}

export const siteConfig = {
  name: "Dietom",
  tagline: "AI-assisted nutrition for people and the dietitians who guide them",
  description:
    "Dietom is an India-first nutrition platform in early development: food tracking, AI recipes, meal plans and tools for professional dietitians.",
  locale: "en_IN",
  url: resolveSiteUrl(),
} as const;

// Homepage sections. The leading "/" makes them work from any page, not only "/".
// Real routes (/pricing, /sign-in, ...) are not built yet, so we don't link to them.
export const mainNav = [
  { label: "Features", href: "/#features" },
  { label: "For dietitians", href: "/#dietitians" },
  { label: "Dashboards", href: "/#dashboards" },
  { label: "Safety", href: "/#safety" },
] as const;

// Paths that are interface previews only. Kept out of the sitemap and blocked
// in robots.txt so search engines don't promote them as product pages.
export const previewOnlyPaths = ["/dashboard", "/dietitian", "/admin", "/ui-kit"];

export type PlannedRoute = {
  label: string;
  path: string;
};

// Public routes from the product plan. Shown as "planned" text, never as live links.
// Dashboard routes live in src/config/dashboard-nav.ts.
export const plannedPublicRoutes: PlannedRoute[] = [
  { label: "Pricing", path: "/pricing" },
  { label: "eBooks", path: "/ebooks" },
  { label: "Recipes", path: "/recipes" },
];
