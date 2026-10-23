import {
  BadgeCheck,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  ChartLine,
  ChefHat,
  ClipboardList,
  CreditCard,
  HeartPulse,
  Library,
  ListChecks,
  Lock,
  Salad,
  ShieldCheck,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

import { dashboardConfigs, type DashboardArea } from "@/config/dashboard-nav";
import type { PlannedRoute } from "@/config/site";

function routesFor(area: DashboardArea): PlannedRoute[] {
  return dashboardConfigs[area].nav.map((item) => ({
    label: item.title,
    path: item.href,
  }));
}

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

// Homepage copy lives in data, not JSX, so sections stay small and the text is
// easy to review or translate later.

export const customerFeatures: Feature[] = [
  {
    icon: Salad,
    title: "Diet & food tracking",
    description:
      "Log meals with Indian foods in mind and see calories, protein and key nutrients add up through the day.",
  },
  {
    icon: ChefHat,
    title: "AI recipe generator",
    description:
      "Turn the ingredients you have into recipes that fit your goals, preferences and dietary restrictions.",
  },
  {
    icon: CalendarDays,
    title: "Weekly meal plans",
    description:
      "Structured weekly plans you can follow on your own or receive from a dietitian you choose to work with.",
  },
  {
    icon: Brain,
    title: "Nutrition assistant",
    description:
      "Ask questions and get answers grounded in a curated nutrition knowledge base, with sources shown.",
  },
  {
    icon: BookOpen,
    title: "eBook store & library",
    description:
      "Buy nutrition guides once and read them anytime from your personal library.",
  },
  {
    icon: ListChecks,
    title: "Nutrition quizzes",
    description:
      "Short quizzes that build food knowledge and help personalise your recommendations.",
  },
  {
    icon: Bell,
    title: "Reminders & updates",
    description:
      "Email and in-app notifications for plans, purchases and account activity.",
  },
  {
    icon: CreditCard,
    title: "Flexible plans",
    description:
      "A free tier plus optional paid plans, with Indian payment methods supported first.",
  },
];

export const dietitianFeatures: Feature[] = [
  {
    icon: BadgeCheck,
    title: "Professional verification",
    description:
      "Practitioner tools unlock only after credentials are reviewed, so clients know who they're working with.",
  },
  {
    icon: Users,
    title: "Client management",
    description:
      "Work with clients who have explicitly consented to share their data with you, and only them.",
  },
  {
    icon: ClipboardList,
    title: "Questionnaires",
    description:
      "Send intake and follow-up questionnaires and keep responses alongside each client's record.",
  },
  {
    icon: CalendarDays,
    title: "Meal plan templates",
    description:
      "Build reusable templates, then adapt and assign them to individual clients.",
  },
  {
    icon: Library,
    title: "Recipe library",
    description:
      "Maintain your own recipe collection and reuse it across plans.",
  },
  {
    icon: ChartLine,
    title: "Progress tracking",
    description:
      "Review client logs and trends over time to guide your next consultation.",
  },
];

export type DashboardPlan = {
  id: string;
  icon: LucideIcon;
  title: string;
  audience: string;
  summary: string;
  routes: PlannedRoute[];
};

export const dashboards: DashboardPlan[] = [
  {
    id: "customer",
    icon: HeartPulse,
    title: "Customer dashboard",
    audience: "Individuals managing their own nutrition",
    summary:
      "Today's intake at a glance, active meal plan, AI recipes, purchased eBooks, quizzes and subscription settings.",
    routes: routesFor("customer"),
  },
  {
    id: "dietitian",
    icon: Stethoscope,
    title: "Dietitian dashboard",
    audience: "Verified nutrition professionals",
    summary:
      "Consenting clients, questionnaires, plan templates, a personal recipe library, progress reviews and AI credit usage.",
    routes: routesFor("dietitian"),
  },
  {
    id: "admin",
    icon: ShieldCheck,
    title: "Admin dashboard",
    audience: "Dietom platform staff only",
    summary:
      "User and role management, dietitian verification reviews, eBook catalogue, payments overview and platform settings.",
    routes: routesFor("admin"),
  },
];

export const safetyPoints: Feature[] = [
  {
    icon: Lock,
    title: "Private by default",
    description:
      "Health records are visible only to you and to dietitians you explicitly approve. Access can be withdrawn.",
  },
  {
    icon: BadgeCheck,
    title: "Verified professionals",
    description:
      "Dietitians must pass a verification review before they can access client tools.",
  },
  {
    icon: Brain,
    title: "Educational AI",
    description:
      "AI suggestions are clearly labelled as educational and never replace care from a qualified professional.",
  },
  {
    icon: ShieldCheck,
    title: "Accountable access",
    description:
      "Sensitive actions are planned to be checked on the server and recorded in an audit log.",
  },
];
