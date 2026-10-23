"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injects a tiny blocking script that sets the "dark" class on
// <html> before the page paints, so there is no flash of the wrong theme.
// - attribute="class": matches the `.dark { ... }` tokens in globals.css
// - defaultTheme="system" + enableSystem: follow the OS setting until the user picks
// - disableTransitionOnChange: no colour animation when switching (avoids a
//   distracting flash, kinder to reduced-motion users)
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
