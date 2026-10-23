import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";

import "./globals.css";

// next/font downloads fonts at build time and self-hosts them (no Google request
// from the browser). `variable` exposes each font as a CSS variable that
// globals.css maps to Tailwind's font-sans / font-mono.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = `${siteConfig.name} | AI-assisted nutrition for India`;

export const metadata: Metadata = {
  // Relative URLs in metadata (canonical, og:image, ...) resolve against this.
  metadataBase: siteConfig.url,
  title: {
    default: defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // og:image and twitter:image come from app/opengraph-image.tsx and
  // app/twitter-image.tsx, which Next.js wires up automatically.
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: defaultTitle,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteConfig.description,
  },
  // Canonical URLs are set per public page (see (marketing)/page.tsx), not here,
  // because a canonical in the root layout would be inherited by every route.
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2f7d4f" },
    { media: "(prefers-color-scheme: dark)", color: "#16241b" },
  ],
};

// Root layout: wraps every route (public, dashboards, admin). Keep it minimal;
// section-specific chrome belongs in route-group layouts.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes adds the "dark" class to <html> before
    // React hydrates, so the server and client class lists legitimately differ.
    // It only applies to this element's own attributes, not its children.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {/* Lets keyboard users jump past the header straight to page content. */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          {children}
          {/* The one app-wide toast outlet. Call toast() from any client component. */}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
