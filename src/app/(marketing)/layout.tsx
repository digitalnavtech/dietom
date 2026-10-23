import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

// Layout for public pages. "(marketing)" is a route group: the folder name is
// not part of the URL, so (marketing)/page.tsx still serves "/".
// Future dashboards get their own groups and layouts (sidebar instead of footer).
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
