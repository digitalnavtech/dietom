"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { dashboardConfigs, type DashboardArea } from "@/config/dashboard-nav";

// Phone navigation: a slide-in drawer (Sheet). Base UI handles the hard
// accessibility parts: focus is trapped inside, Escape closes it, and focus
// returns to the menu button afterwards.
export function MobileDashboardNavigation({ area }: { area: DashboardArea }) {
  const [open, setOpen] = useState(false);
  const config = dashboardConfigs[area];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="md:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{config.label}</SheetTitle>
          <SheetDescription>Interface preview</SheetDescription>
        </SheetHeader>
        <nav aria-label={config.label} className="overflow-y-auto p-3">
          {/* Close the drawer after choosing a page. */}
          <DashboardNavLinks area={area} onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
