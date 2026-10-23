// Pure helpers for search, filter, sort and pagination.
//
// No React, no Next.js, no imports: they take plain data and return plain data,
// which makes them easy to test (see list-query.test.ts) and easy to replace
// later with database queries. The same ListQuery object will be turned into
// SQL (WHERE / ORDER BY / LIMIT / OFFSET) with Drizzle in a later step.

export const SORT_OPTIONS = ["newest", "oldest", "title-asc", "title-desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const MAX_SEARCH_LENGTH = 100;

export type ListQuery = {
  q: string;
  category: string | null;
  sort: SortOption;
  page: number;
};

// Shape of Next.js `searchParams` after awaiting.
export type SearchParamsRecord = Record<string, string | string[] | undefined>;

type ParseOptions = {
  categories: readonly string[];
  defaultSort?: SortOption;
};

// URL values come from the user, so treat them as untrusted: take the first
// value, trim, cap the length and fall back to defaults when invalid.
export function readParam(
  params: SearchParamsRecord,
  key: string,
): string | undefined {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

function isSortOption(value: string | undefined): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

export function parseListQuery(
  params: SearchParamsRecord,
  { categories, defaultSort = "newest" }: ParseOptions,
): ListQuery {
  const q = (readParam(params, "q") ?? "").slice(0, MAX_SEARCH_LENGTH);

  const rawCategory = readParam(params, "category");
  const category =
    rawCategory && categories.includes(rawCategory) ? rawCategory : null;

  const rawSort = readParam(params, "sort");
  const sort = isSortOption(rawSort) ? rawSort : defaultSort;

  const rawPage = Number(readParam(params, "page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return { q, category, sort, page };
}

function normalize(text: string): string {
  return text
    .toLocaleLowerCase("en")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

// Every word in the query must appear somewhere in the item's searchable text.
// "veg protein" matches "High-Protein Vegetarian Meals".
export function filterBySearch<T>(
  items: readonly T[],
  query: string,
  getSearchText: (item: T) => string,
): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...items];
  return items.filter((item) => {
    const haystack = normalize(getSearchText(item));
    return words.every((word) => haystack.includes(word));
  });
}

export function filterByCategory<T>(
  items: readonly T[],
  category: string | null,
  getCategory: (item: T) => string,
): T[] {
  if (!category) return [...items];
  return items.filter((item) => getCategory(item) === category);
}

type SortAccessors<T> = {
  getTitle: (item: T) => string;
  // ISO date string (YYYY-MM-DD), which sorts correctly as plain text.
  getDate: (item: T) => string;
};

// Returns a new array; never mutates the input.
export function sortByTitleOrDate<T>(
  items: readonly T[],
  sort: SortOption,
  { getTitle, getDate }: SortAccessors<T>,
): T[] {
  const byTitle = (a: T, b: T) =>
    getTitle(a).localeCompare(getTitle(b), "en", { sensitivity: "base" });
  const byDate = (a: T, b: T) => getDate(a).localeCompare(getDate(b));

  const sorted = [...items];
  switch (sort) {
    case "title-asc":
      return sorted.sort(byTitle);
    case "title-desc":
      return sorted.sort((a, b) => byTitle(b, a));
    case "oldest":
      return sorted.sort((a, b) => byDate(a, b) || byTitle(a, b));
    case "newest":
      return sorted.sort((a, b) => byDate(b, a) || byTitle(a, b));
  }
}

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  // 1-based positions for "Showing 11–20 of 42". Both 0 when empty.
  from: number;
  to: number;
};

// Clamps the page so ?page=999 shows the last page instead of an empty list.
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): PageResult<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  const current = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (current - 1) * size;
  const pageItems = items.slice(start, start + size);

  return {
    items: pageItems,
    page: current,
    pageSize: size,
    totalItems,
    totalPages,
    from: pageItems.length ? start + 1 : 0,
    to: start + pageItems.length,
  };
}

// Builds "?q=...&page=2" from the current state plus changes. Empty values and
// defaults are dropped to keep URLs short and shareable.
export function buildListHref(
  pathname: string,
  current: ListQuery,
  changes: Partial<ListQuery>,
  defaults: Pick<ListQuery, "sort"> = { sort: "newest" },
): string {
  const next = { ...current, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.sort !== defaults.sort) params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}
