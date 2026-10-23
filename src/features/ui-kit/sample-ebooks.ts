// ⚠ FICTIONAL SAMPLE DATA, for the UI kit demonstration only.
// These are not real products, have no authors or prices, and are not for sale.
// Never import this file from production features; real eBooks will come from
// the database (see docs/DATABASE_PLAN.md).

export const SAMPLE_EBOOK_CATEGORIES = [
  { value: "basics", label: "Nutrition basics" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "family", label: "Family & kids" },
  { value: "sports", label: "Active lifestyle" },
  { value: "cooking", label: "Everyday cooking" },
] as const;

export type SampleEbookCategory = (typeof SAMPLE_EBOOK_CATEGORIES)[number]["value"];

export type SampleEbook = {
  id: string;
  title: string;
  category: SampleEbookCategory;
  // ISO date, which sorts correctly as text.
  publishedOn: string;
  pages: number;
};

export const sampleEbooks: SampleEbook[] = [
  { id: "s01", title: "Sample: Balanced Thali Basics", category: "basics", publishedOn: "2026-01-12", pages: 48 },
  { id: "s02", title: "Sample: Reading Food Labels", category: "basics", publishedOn: "2025-09-03", pages: 32 },
  { id: "s03", title: "Sample: Protein for Vegetarians", category: "vegetarian", publishedOn: "2026-03-21", pages: 64 },
  { id: "s04", title: "Sample: Millet Meals Made Simple", category: "cooking", publishedOn: "2026-05-08", pages: 56 },
  { id: "s05", title: "Sample: Lunchbox Ideas for Kids", category: "family", publishedOn: "2025-12-15", pages: 40 },
  { id: "s06", title: "Sample: Hydration Through the Seasons", category: "basics", publishedOn: "2026-04-02", pages: 28 },
  { id: "s07", title: "Sample: Pre- and Post-Workout Snacks", category: "sports", publishedOn: "2026-02-17", pages: 36 },
  { id: "s08", title: "Sample: One-Pot Dal Variations", category: "cooking", publishedOn: "2025-10-27", pages: 44 },
  { id: "s09", title: "Sample: Plant-Based Breakfasts", category: "vegetarian", publishedOn: "2026-06-30", pages: 38 },
  { id: "s10", title: "Sample: Family Meal Planning", category: "family", publishedOn: "2026-07-19", pages: 52 },
  { id: "s11", title: "Sample: Walking and Everyday Activity", category: "sports", publishedOn: "2025-08-11", pages: 30 },
  { id: "s12", title: "Sample: Smart Snacking", category: "basics", publishedOn: "2026-08-05", pages: 26 },
  { id: "s13", title: "Sample: Festive Cooking, Lighter", category: "cooking", publishedOn: "2026-09-14", pages: 60 },
  { id: "s14", title: "Sample: Sprouts and Pulses Guide", category: "vegetarian", publishedOn: "2025-11-06", pages: 34 },
];

export function sampleCategoryLabel(value: string): string {
  return SAMPLE_EBOOK_CATEGORIES.find((category) => category.value === value)?.label ?? value;
}
