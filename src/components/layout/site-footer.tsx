import { CopyrightYear } from "@/components/layout/copyright-year";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { plannedPublicRoutes, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              {siteConfig.tagline}. Built in India, designed to grow
              internationally.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Planned pages</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {plannedPublicRoutes.map((route) => (
                <li key={route.path}>
                  {route.label}{" "}
                  <span className="text-xs opacity-70">(coming soon)</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Project status</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Dietom is in early development. Accounts, payments and AI
              features are not live yet.
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {siteConfig.name}. All rights
            reserved.
          </p>
          <p className="max-w-xl sm:text-right">
            Nutrition information on Dietom is educational and is not a
            substitute for advice from a qualified doctor or registered
            dietitian.
          </p>
        </div>
      </div>
    </footer>
  );
}
