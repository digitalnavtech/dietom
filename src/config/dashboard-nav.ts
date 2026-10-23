import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Library,
  ListChecks,
  Salad,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// One config drives the sidebar, the mobile drawer, page headings and the
// "planned" content of each preview page. Add a route here, then add its page file.

export type DashboardArea = "customer" | "dietitian" | "admin";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  // What this page will contain once built. Shown on the preview page.
  planned: string[];
};

export type DashboardConfig = {
  label: string;
  homeHref: string;
  icon: LucideIcon;
  nav: DashboardNavItem[];
};

export const dashboardConfigs: Record<DashboardArea, DashboardConfig> = {
  customer: {
    label: "Customer dashboard",
    homeHref: "/dashboard",
    icon: Salad,
    nav: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "A summary of your day, your plan and shortcuts.",
        planned: [
          "Today's logged meals against your personal targets",
          "Your active meal plan and next meal",
          "Recent AI recipes and reading progress",
        ],
      },
      {
        title: "Diet tracker",
        href: "/dashboard/diet-tracker",
        icon: Salad,
        description: "Log meals and follow your nutrients through the day.",
        planned: [
          "Food search with Indian foods and portion units",
          "Meal-by-meal diary with calories and macronutrients",
          "Weekly trends you can share with a consented dietitian",
        ],
      },
      {
        title: "Meal plans",
        href: "/dashboard/meal-plans",
        icon: CalendarDays,
        description: "Weekly plans you create or receive from a dietitian.",
        planned: [
          "Day-by-day plan view with recipes",
          "Plans assigned by a dietitian you have approved",
          "Shopping list generated from the plan",
        ],
      },
      {
        title: "My eBooks",
        href: "/dashboard/my-ebooks",
        icon: BookOpen,
        description: "Nutrition guides you have purchased.",
        planned: [
          "Library of purchased eBooks",
          "Secure in-browser reader with short-lived access links",
        ],
      },
      {
        title: "AI recipes",
        href: "/dashboard/ai-recipes",
        icon: ChefHat,
        description: "Generate recipes from your ingredients and goals.",
        planned: [
          "Recipe generator using your dietary preferences",
          "Saved recipes and credit usage per generation",
          "Clear 'educational, not medical advice' labelling",
        ],
      },
      {
        title: "Quizzes",
        href: "/dashboard/quizzes",
        icon: ListChecks,
        description: "Short quizzes that build nutrition knowledge.",
        planned: ["Quiz catalogue", "Your results and explanations"],
      },
      {
        title: "Subscription",
        href: "/dashboard/subscription",
        icon: CreditCard,
        description: "Your plan, billing and AI credits.",
        planned: [
          "Current plan and renewal date",
          "Upgrade, downgrade and cancellation according to billing rules",
          "Invoices and AI credit balance",
        ],
      },
    ],
  },
  dietitian: {
    label: "Dietitian dashboard",
    homeHref: "/dietitian",
    icon: Stethoscope,
    nav: [
      {
        title: "Overview",
        href: "/dietitian",
        icon: LayoutDashboard,
        description: "Your practice at a glance.",
        planned: [
          "Verification status and next steps",
          "Clients needing attention and pending questionnaires",
          "AI credit balance",
        ],
      },
      {
        title: "Clients",
        href: "/dietitian/clients",
        icon: Users,
        description: "Clients who have consented to work with you.",
        planned: [
          "Client list limited to active, consented relationships",
          "Questionnaire responses and progress per client",
          "Invite a client (they must accept before you see any data)",
        ],
      },
      {
        title: "Meal plans",
        href: "/dietitian/meal-plans",
        icon: CalendarDays,
        description: "Reusable templates and client assignments.",
        planned: [
          "Template builder",
          "Assign and customise a template for a client",
        ],
      },
      {
        title: "Recipes",
        href: "/dietitian/recipes",
        icon: Library,
        description: "Your personal recipe library.",
        planned: ["Create and organise recipes", "Reuse recipes across plans"],
      },
      {
        title: "Appointments",
        href: "/dietitian/appointments",
        icon: CalendarClock,
        description: "Scheduling with clients (future phase).",
        planned: ["Availability and bookings", "Reminders for you and clients"],
      },
      {
        title: "Subscription",
        href: "/dietitian/subscription",
        icon: CreditCard,
        description: "Your professional plan and AI credits.",
        planned: ["Professional plan details", "Credit packs and usage"],
      },
    ],
  },
  admin: {
    label: "Admin dashboard",
    homeHref: "/admin",
    icon: ShieldCheck,
    nav: [
      {
        title: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Platform health and pending work.",
        planned: [
          "Verification queue size",
          "Recent payment and email delivery issues",
        ],
      },
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        description: "Accounts and role management.",
        planned: [
          "Search users and view account status",
          "Role changes restricted to super admins and recorded in the audit log",
        ],
      },
      {
        title: "Dietitians",
        href: "/admin/dietitians",
        icon: BadgeCheck,
        description: "Professional verification reviews.",
        planned: [
          "Review submitted credentials",
          "Approve, reject or suspend, with a recorded reason",
        ],
      },
      {
        title: "eBooks",
        href: "/admin/ebooks",
        icon: BookOpen,
        description: "The eBook catalogue.",
        planned: ["Create and publish eBooks", "Configure prices per currency"],
      },
      {
        title: "Payments",
        href: "/admin/payments",
        icon: Wallet,
        description: "Orders, subscriptions and refunds.",
        planned: [
          "Payment and webhook event history",
          "Refunds according to the published refund policy",
        ],
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
        description: "Plans, prices, credits and platform options.",
        planned: [
          "Plan limits, trial settings and AI credit costs",
          "Feature flags",
        ],
      },
    ],
  },
};

export function getDashboardPage(
  area: DashboardArea,
  href: string,
): DashboardNavItem {
  const item = dashboardConfigs[area].nav.find((entry) => entry.href === href);
  // A missing entry is a programming mistake, so fail the build loudly.
  if (!item) throw new Error(`No dashboard nav entry for ${href}`);
  return item;
}

// "Overview" (the area's home) only matches exactly; other items also match
// nested routes, e.g. /dietitian/clients/123 highlights "Clients".
export function isNavItemActive(
  pathname: string,
  href: string,
  homeHref: string,
): boolean {
  if (href === homeHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
