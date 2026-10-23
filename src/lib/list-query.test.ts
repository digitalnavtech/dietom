// Run with: npm test
// Uses Node's built-in test runner and TypeScript type stripping (Node 22.18+),
// so no test framework needs to be installed.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildListHref,
  filterByCategory,
  filterBySearch,
  paginate,
  parseListQuery,
  sortByTitleOrDate,
} from "./list-query.ts";

type Item = { title: string; category: string; date: string };

const items: Item[] = [
  { title: "Balanced Thali Basics", category: "basics", date: "2026-01-10" },
  { title: "High-Protein Vegetarian Meals", category: "sports", date: "2026-03-05" },
  { title: "Ápple & Oats Breakfasts", category: "basics", date: "2025-11-20" },
  { title: "Kids' Lunchbox Ideas", category: "family", date: "2026-03-05" },
];

const searchText = (item: Item) => `${item.title} ${item.category}`;

describe("parseListQuery", () => {
  const options = { categories: ["basics", "sports", "family"] };

  it("returns defaults for empty params", () => {
    assert.deepEqual(parseListQuery({}, options), {
      q: "",
      category: null,
      sort: "newest",
      page: 1,
    });
  });

  it("reads valid values and trims the query", () => {
    assert.deepEqual(
      parseListQuery(
        { q: "  thali ", category: "basics", sort: "title-asc", page: "3" },
        options,
      ),
      { q: "thali", category: "basics", sort: "title-asc", page: 3 },
    );
  });

  it("ignores unknown categories, sorts and invalid pages", () => {
    const result = parseListQuery(
      { category: "hacker", sort: "price", page: "-2" },
      options,
    );
    assert.equal(result.category, null);
    assert.equal(result.sort, "newest");
    assert.equal(result.page, 1);
    assert.equal(parseListQuery({ page: "2.5" }, options).page, 1);
    assert.equal(parseListQuery({ page: "abc" }, options).page, 1);
  });

  it("uses the first value of repeated params and caps query length", () => {
    assert.equal(parseListQuery({ q: ["first", "second"] }, options).q, "first");
    assert.equal(parseListQuery({ q: "x".repeat(500) }, options).q.length, 100);
  });
});

describe("filterBySearch", () => {
  it("returns everything for an empty query", () => {
    assert.equal(filterBySearch(items, "   ", searchText).length, items.length);
  });

  it("matches case-insensitively and requires every word", () => {
    const result = filterBySearch(items, "VEG protein", searchText);
    assert.deepEqual(result.map((item) => item.title), [
      "High-Protein Vegetarian Meals",
    ]);
    assert.equal(filterBySearch(items, "veg kids", searchText).length, 0);
  });

  it("ignores accents", () => {
    assert.equal(filterBySearch(items, "apple", searchText).length, 1);
  });
});

describe("filterByCategory", () => {
  it("keeps all items when no category is selected", () => {
    assert.equal(filterByCategory(items, null, (i) => i.category).length, 4);
  });

  it("keeps only the selected category", () => {
    const result = filterByCategory(items, "basics", (i) => i.category);
    assert.equal(result.length, 2);
  });
});

describe("sortByTitleOrDate", () => {
  const accessors = { getTitle: (i: Item) => i.title, getDate: (i: Item) => i.date };

  it("sorts by title both ways", () => {
    const asc = sortByTitleOrDate(items, "title-asc", accessors).map((i) => i.title);
    assert.equal(asc[0], "Ápple & Oats Breakfasts");
    const desc = sortByTitleOrDate(items, "title-desc", accessors).map((i) => i.title);
    assert.equal(desc[0], "Kids' Lunchbox Ideas");
  });

  it("sorts by date and breaks ties by title", () => {
    const newest = sortByTitleOrDate(items, "newest", accessors).map((i) => i.title);
    assert.deepEqual(newest.slice(0, 2), [
      "High-Protein Vegetarian Meals",
      "Kids' Lunchbox Ideas",
    ]);
    const oldest = sortByTitleOrDate(items, "oldest", accessors);
    assert.equal(oldest[0].date, "2025-11-20");
  });

  it("does not mutate the input", () => {
    const before = items.map((i) => i.title);
    sortByTitleOrDate(items, "title-desc", accessors);
    assert.deepEqual(items.map((i) => i.title), before);
  });
});

describe("paginate", () => {
  const numbers = Array.from({ length: 23 }, (_, i) => i + 1);

  it("returns the requested page with positions", () => {
    const result = paginate(numbers, 2, 10);
    assert.deepEqual(result.items, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    assert.equal(result.totalPages, 3);
    assert.equal(result.from, 11);
    assert.equal(result.to, 20);
  });

  it("handles a partial last page", () => {
    const result = paginate(numbers, 3, 10);
    assert.deepEqual(result.items, [21, 22, 23]);
    assert.equal(result.to, 23);
  });

  it("clamps out-of-range pages", () => {
    assert.equal(paginate(numbers, 99, 10).page, 3);
    assert.equal(paginate(numbers, 0, 10).page, 1);
  });

  it("handles empty lists", () => {
    const result = paginate([], 1, 10);
    assert.equal(result.totalPages, 1);
    assert.equal(result.from, 0);
    assert.equal(result.to, 0);
  });
});

describe("buildListHref", () => {
  const base = { q: "", category: null, sort: "newest" as const, page: 1 };

  it("omits defaults", () => {
    assert.equal(buildListHref("/ui-kit", base, {}), "/ui-kit");
  });

  it("encodes changed values", () => {
    assert.equal(
      buildListHref("/ui-kit", base, { q: "dal & rice", page: 2 }),
      "/ui-kit?q=dal+%26+rice&page=2",
    );
  });

  it("keeps existing filters while changing one", () => {
    const current = { ...base, category: "basics", sort: "title-asc" as const };
    assert.equal(
      buildListHref("/ui-kit", current, { page: 3 }),
      "/ui-kit?category=basics&sort=title-asc&page=3",
    );
  });
});
