import { ArrowRight, Info, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Sample numbers for the illustrative card. Clearly labelled on screen as sample
// data so nobody mistakes it for a working tracker.
const sampleMeals = [
  { meal: "Breakfast", food: "Vegetable poha, curd", kcal: 380 },
  { meal: "Lunch", food: "Dal, brown rice, sabzi, salad", kcal: 560 },
  { meal: "Snack", food: "Roasted chana, fruit", kcal: 210 },
];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
    >
      {/* Decorative background blobs; hidden from screen readers. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-secondary blur-3xl" />
        <div className="absolute top-40 -right-24 size-72 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-warm" aria-hidden="true" />
            In early development · India-first
          </p>

          <h1
            id="hero-title"
            className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Everyday nutrition, guided by{" "}
            <span className="text-primary">AI and real dietitians</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
            Dietom is being built to help you track what you eat, plan balanced
            weekly meals and cook smarter, and to give dietitians a calm,
            secure workspace for their clients.
          </p>

          {/* Links styled as buttons. These are in-page anchors: no fake sign-up. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#features"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}
            >
              Explore features
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </a>
            <a
              href="#dietitians"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-5 text-base",
              )}
            >
              I&apos;m a dietitian
            </a>
          </div>

          <p className="mt-6 flex max-w-xl items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            AI guidance on Dietom will be educational and is not a substitute
            for professional medical care.
          </p>
        </div>

        <Card className="relative mx-auto w-full max-w-md shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Today&apos;s meals</CardTitle>
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                Illustrative preview
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {sampleMeals.map((item) => (
                <li
                  key={item.meal}
                  className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{item.meal}</p>
                    <p className="text-xs text-muted-foreground">{item.food}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {item.kcal} kcal
                  </p>
                </li>
              ))}
            </ul>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sample daily goal</span>
                <span className="tabular-nums">1,150 / 1,800 kcal</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
                aria-hidden="true"
              >
                <div className="h-full w-[64%] rounded-full bg-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sample data for illustration. Tracking is not available yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
