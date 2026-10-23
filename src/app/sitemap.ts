import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

// Generates /sitemap.xml. Only real, finished public pages belong here.
// Add /pricing, /ebooks and /recipes when those pages are built.
// (No lastModified: a build-time timestamp would claim every page changed on
// every deploy, which isn't true.)
const publicPaths = ["/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
