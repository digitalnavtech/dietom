import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: data is dynamic by default; opt in to caching with "use cache".
  // Safer for health data, which should never be served stale by accident.
  cacheComponents: true,
  // Links prefetch only the static "app shell" of each route.
  partialPrefetching: true,
  turbopack: {
    // Pin the project root. A stray package-lock.json in the user's home folder
    // otherwise makes Next.js guess the wrong workspace root.
    root: path.join(__dirname),
    rules: {
      // Tailwind v4 runs through Turbopack's loader (no postcss.config needed).
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
