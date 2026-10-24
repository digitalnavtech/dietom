"use client";

// Client Component: the only part of the header that needs state (open/closed).
// Keeping it small means the rest of the header stays a Server Component.

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { mainNav } from "@/config/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </Button>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full border-b bg-background/95 px-4 pb-4 shadow-sm backdrop-blur"
        >
          <ul className="flex flex-col gap-1 pt-2">
            {mainNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-base font-medium hover:bg-muted"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="mt-2 grid grid-cols-2 gap-2 border-t pt-3">
              <Link href="/sign-in" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>
                Sign in
              </Link>
              <Link href="/sign-up" onClick={() => setOpen(false)} className={buttonVariants()}>
                Create account
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
