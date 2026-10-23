import type { MetadataRoute } from "next";

import { previewOnlyPaths, siteConfig } from "@/config/site";

// Generates /robots.txt. Preview-only areas are disallowed so crawlers don't
// treat them as product pages (they also send a noindex meta tag).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: previewOnlyPaths,
    },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}
